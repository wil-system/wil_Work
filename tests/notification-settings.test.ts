import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettingColumn,
  normalizeNotificationSettings,
} from '../lib/notification-settings.ts';

test('normalizes notification settings and removes unsupported options', () => {
  const settings = normalizeNotificationSettings({
    '새 댓글 알림': false,
    '다크 모드': true,
  });

  assert.deepEqual(settings, {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    '새 댓글 알림': false,
  });
  assert.equal('다크 모드' in settings, false);
});

test('maps Korean setting labels to database columns', () => {
  assert.equal(getNotificationSettingColumn('새 댓글 알림'), 'comment_notifications');
  assert.equal(getNotificationSettingColumn('가입 승인 알림'), 'approval_notifications');
  assert.equal(getNotificationSettingColumn('알림 배지 표시'), 'badge_notifications');
});
