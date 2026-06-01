export type NotificationSettingKey =
  | '새 댓글 알림'
  | '가입 승인 알림'
  | '알림 배지 표시';

export type NotificationSettings = Record<NotificationSettingKey, boolean>;

export type NotificationSettingColumn =
  | 'comment_notifications'
  | 'approval_notifications'
  | 'badge_notifications';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  '새 댓글 알림': true,
  '가입 승인 알림': true,
  '알림 배지 표시': true,
};

export const NOTIFICATION_SETTING_COLUMNS: Record<NotificationSettingKey, NotificationSettingColumn> = {
  '새 댓글 알림': 'comment_notifications',
  '가입 승인 알림': 'approval_notifications',
  '알림 배지 표시': 'badge_notifications',
};

const NOTIFICATION_SETTING_KEYS = Object.keys(DEFAULT_NOTIFICATION_SETTINGS) as NotificationSettingKey[];

export function normalizeNotificationSettings(
  value: Partial<Record<string, unknown>> | null | undefined,
): NotificationSettings {
  const normalized = { ...DEFAULT_NOTIFICATION_SETTINGS };
  if (!value || typeof value !== 'object') return normalized;

  for (const key of NOTIFICATION_SETTING_KEYS) {
    if (typeof value[key] === 'boolean') normalized[key] = value[key];
  }

  return normalized;
}

export function getNotificationSettingColumn(key: NotificationSettingKey): NotificationSettingColumn {
  return NOTIFICATION_SETTING_COLUMNS[key];
}

export function settingsFromDbRow(row: Partial<Record<NotificationSettingColumn, unknown>> | null | undefined): NotificationSettings {
  if (!row) return DEFAULT_NOTIFICATION_SETTINGS;

  return {
    '새 댓글 알림': typeof row.comment_notifications === 'boolean'
      ? row.comment_notifications
      : DEFAULT_NOTIFICATION_SETTINGS['새 댓글 알림'],
    '가입 승인 알림': typeof row.approval_notifications === 'boolean'
      ? row.approval_notifications
      : DEFAULT_NOTIFICATION_SETTINGS['가입 승인 알림'],
    '알림 배지 표시': typeof row.badge_notifications === 'boolean'
      ? row.badge_notifications
      : DEFAULT_NOTIFICATION_SETTINGS['알림 배지 표시'],
  };
}
