import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('notification clicks mark the selected item as read before navigation', () => {
  const pageSource = read('app/(workspace)/notifications/page.tsx');
  const dbSource = read('lib/db/notifications.ts');

  assert.match(pageSource, /import \{ getMyNotifications, markAllRead, markNotificationRead, deleteReadNotifications \}/);
  assert.match(pageSource, /async function openNotificationAction\(formData: FormData\)/);
  assert.match(pageSource, /await markNotificationRead\(notificationId\)/);
  assert.match(pageSource, /if \(notification\?\.link\) redirect\(notification\.link\)/);
  assert.match(pageSource, /<form action=\{openNotificationAction\}/);
  assert.match(pageSource, /name="notificationId"/);
  assert.equal(pageSource.includes('name="link"'), false);
  assert.equal(pageSource.includes('import Link from'), false);

  assert.match(dbSource, /export async function markNotificationRead\(notificationId: string\): Promise<Notification \| null>/);
  assert.match(dbSource, /\.update\(\{ is_read: true \}\)/);
  assert.match(dbSource, /\.eq\('profile_id', user\.id\)/);
  assert.match(dbSource, /\.eq\('id', notificationId\)/);
  assert.match(dbSource, /\.maybeSingle\(\)/);
});
