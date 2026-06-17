import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

test('latest migrations repair the required full feed board row', () => {
  const migrationName = readdirSync(resolve('supabase/migrations'))
    .filter(name => name.endsWith('.sql'))
    .sort()
    .find(name => name.includes('ensure_system_boards'));

  assert.ok(migrationName, 'a migration should repair missing system board rows');

  const migration = read(`supabase/migrations/${migrationName}`);
  assert.match(migration, /insert into public\.work_boards/i);
  assert.match(migration, /\('feed'\s*,\s*'전체 피드'/);
  assert.match(migration, /on conflict \(id\) do update/i);
  assert.match(migration, /is_public\s*=\s*true/i);
  assert.match(migration, /display_order\s*=\s*0/i);
});

test('latest migrations normalize notice before team boards', () => {
  const migrationName = readdirSync(resolve('supabase/migrations'))
    .filter(name => name.endsWith('.sql'))
    .sort()
    .find(name => name.includes('normalize_system_board_order'));

  assert.ok(migrationName, 'a migration should normalize system board display order');

  const migration = read(`supabase/migrations/${migrationName}`);
  assert.match(migration, /\('notice'\s*,\s*'공지사항'[\s\S]*?,\s*1\)/);
  assert.match(migration, /display_order\s*=\s*1/i);
  assert.match(migration, /where\s+id\s+not\s+in\s+\('feed',\s*'notice'\)/i);
  assert.match(migration, /row_number\(\)\s+over/i);
});
