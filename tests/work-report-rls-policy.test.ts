import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

function policy(sql: string, name: string, operation: 'select' | 'insert' | 'update') {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `create policy "${escapedName}"[\\s\\S]*?for ${operation}[\\s\\S]*?;`,
    'i',
  );
  const match = sql.match(pattern);
  assert.ok(match, `${name} ${operation} policy should exist`);
  return match[0];
}

test('work report read policy limits report visibility to authors and selected recipients', () => {
  const schemaPolicy = policy(
    read('supabase/schema.sql'),
    'Users can read accessible reports',
    'select',
  );

  assert.match(schemaPolicy, /author_id\s*=\s*auth\.uid\(\)/);
  assert.match(schemaPolicy, /recipient_id\s*=\s*auth\.uid\(\)/);
  assert.equal(schemaPolicy.includes('is_work_report_reviewer'), false);
});

test('latest work report migration removes hierarchy reviewer report visibility', () => {
  const migration = read('supabase/migrations/20260610180000_recipient_only_work_reports.sql');
  const readPolicy = policy(migration, 'Users can read accessible reports', 'select');
  const updatePolicy = policy(migration, 'Users can update accessible reports', 'update');

  assert.equal(readPolicy.includes('is_work_report_reviewer'), false);
  assert.equal(updatePolicy.includes('is_work_report_reviewer'), false);
  assert.match(readPolicy, /recipient_id\s*=\s*auth\.uid\(\)/);
});

test('work report insert policy allows null-board reports while still blocking notices', () => {
  const schemaPolicy = policy(
    read('supabase/schema.sql'),
    'Users can insert own reports',
    'insert',
  );
  const migration = read('supabase/migrations/20260610191000_allow_null_board_work_reports.sql');
  const migrationPolicy = policy(migration, 'Users can insert own reports', 'insert');

  assert.match(schemaPolicy, /board_id\s+is\s+null/);
  assert.match(schemaPolicy, /board_id\s+<>\s+'notice'/);
  assert.equal(schemaPolicy.includes("board_id not in ('feed', 'notice')"), false);
  assert.match(migrationPolicy, /board_id\s+is\s+null/);
});
