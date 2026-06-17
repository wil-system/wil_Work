import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('read notifications can be cleared without deleting unread notifications', () => {
  const pageSource = read('app/(workspace)/notifications/page.tsx');
  const dbSource = read('lib/db/notifications.ts');
  const schema = read('supabase/schema.sql');
  const migration = read('supabase/migrations/20260617113000_delete_read_notifications_policy.sql');

  assert.match(pageSource, /import \{ getMyNotifications, markAllRead, markNotificationRead, deleteReadNotifications \}/);
  assert.match(pageSource, /async function deleteReadNotificationsAction\(\)/);
  assert.match(pageSource, /await deleteReadNotifications\(\)/);
  assert.match(pageSource, /<form action=\{deleteReadNotificationsAction\}>/);
  assert.match(pageSource, /읽은 알림 삭제/);

  assert.match(dbSource, /export async function deleteReadNotifications\(\): Promise<void>/);
  assert.match(dbSource, /\.delete\(\)/);
  assert.match(dbSource, /\.eq\('profile_id', user\.id\)/);
  assert.match(dbSource, /\.eq\('is_read', true\)/);

  for (const sql of [schema, migration]) {
    assert.match(sql, /Users can delete own read notifications/);
    assert.match(sql, /for delete/i);
    assert.match(sql, /profile_id\s*=\s*auth\.uid\(\)\s+and\s+is_read\s*=\s*true/i);
  }
});
