import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

function policy(sql: string, name: string, operation: 'select' | 'insert' | 'update' | 'delete') {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `create policy "${escapedName}"[\\s\\S]*?for ${operation}[\\s\\S]*?;`,
    'i',
  );
  const match = sql.match(pattern);
  assert.ok(match, `${name} ${operation} policy should exist`);
  return match[0];
}

function assertPersonalCalendarPolicies(sql: string) {
  const readPolicy = policy(sql, 'Users can read own events', 'select');
  const insertPolicy = policy(sql, 'Users can insert own events', 'insert');
  const updatePolicy = policy(sql, 'Users can update own events', 'update');
  const deletePolicy = policy(sql, 'Users can delete own events', 'delete');

  assert.match(readPolicy, /is_work_approved\(\)/);
  assert.match(readPolicy, /created_by\s*=\s*auth\.uid\(\)/);
  assert.match(insertPolicy, /with check[\s\S]*is_work_approved\(\)/i);
  assert.match(insertPolicy, /with check[\s\S]*created_by\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /using[\s\S]*created_by\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /with check[\s\S]*created_by\s*=\s*auth\.uid\(\)/i);
  assert.match(deletePolicy, /using[\s\S]*is_work_approved\(\)/i);
  assert.match(deletePolicy, /using[\s\S]*created_by\s*=\s*auth\.uid\(\)/i);
  assert.equal(updatePolicy.includes('is_work_admin()'), false);
  assert.equal(/create policy "Approved users can read all events"/i.test(sql), false);
  assert.equal(/create policy "Creator or admin can update events"/i.test(sql), false);
}

test('calendar RLS keeps schedules and todos visible only to their creator', () => {
  const schema = read('supabase/schema.sql');

  assert.match(schema, /created_by uuid default auth\.uid\(\) references work_profiles/);
  assertPersonalCalendarPolicies(schema);
});

test('latest calendar migration replaces shared event visibility with personal policies', () => {
  const migration = read('supabase/migrations/20260622100000_personal_calendar_events.sql');

  assert.match(migration, /alter column created_by set default auth\.uid\(\)/);
  const readPolicy = policy(migration, 'Users can read own events', 'select');
  const insertPolicy = policy(migration, 'Users can insert own events', 'insert');
  const updatePolicy = policy(migration, 'Users can update own events', 'update');

  assert.match(readPolicy, /is_work_approved\(\)/);
  assert.match(readPolicy, /created_by\s*=\s*auth\.uid\(\)/);
  assert.match(insertPolicy, /with check[\s\S]*created_by\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /with check[\s\S]*created_by\s*=\s*auth\.uid\(\)/i);
});

test('latest calendar delete migration allows users to delete only own events', () => {
  const migration = read('supabase/migrations/20260623100000_calendar_event_delete_policy.sql');
  const deletePolicy = policy(migration, 'Users can delete own events', 'delete');

  assert.match(deletePolicy, /using[\s\S]*is_work_approved\(\)/i);
  assert.match(deletePolicy, /using[\s\S]*created_by\s*=\s*auth\.uid\(\)/i);
});

test('memo RLS keeps notes visible and mutable only by their author', () => {
  const schema = read('supabase/schema.sql');
  const readPolicy = policy(schema, 'Users can read own memos', 'select');
  const insertPolicy = policy(schema, 'Users can insert own memos', 'insert');
  const updatePolicy = policy(schema, 'Users can update own memos', 'update');
  const deletePolicy = policy(schema, 'Users can delete own memos', 'delete');

  assert.match(readPolicy, /author_id\s*=\s*auth\.uid\(\)/);
  assert.match(insertPolicy, /with check[\s\S]*author_id\s*=\s*auth\.uid\(\)/i);
  assert.match(updatePolicy, /using[\s\S]*author_id\s*=\s*auth\.uid\(\)/i);
  assert.match(deletePolicy, /using[\s\S]*author_id\s*=\s*auth\.uid\(\)/i);
});
