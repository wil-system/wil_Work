import { isDemoMode } from '@/lib/demo-mode';
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  getNotificationSettingColumn,
  settingsFromDbRow,
  type NotificationSettingColumn,
  type NotificationSettingKey,
  type NotificationSettings,
} from '@/lib/notification-settings';
import { createClient } from '@/lib/supabase/server';

type NotificationSettingsRow = Record<NotificationSettingColumn, boolean>;

export async function getMyNotificationSettings(): Promise<NotificationSettings> {
  if (isDemoMode()) return DEFAULT_NOTIFICATION_SETTINGS;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_NOTIFICATION_SETTINGS;

  const { data, error } = await supabase
    .from('work_notification_settings')
    .select('comment_notifications, approval_notifications, badge_notifications')
    .eq('profile_id', user.id)
    .maybeSingle();

  if (error) return DEFAULT_NOTIFICATION_SETTINGS;
  return settingsFromDbRow(data as Partial<NotificationSettingsRow> | null);
}

export async function updateMyNotificationSetting(
  key: NotificationSettingKey,
  enabled: boolean,
): Promise<NotificationSettings> {
  if (isDemoMode()) return { ...DEFAULT_NOTIFICATION_SETTINGS, [key]: enabled };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return DEFAULT_NOTIFICATION_SETTINGS;

  const current = await getMyNotificationSettings();
  const next = { ...current, [key]: enabled };
  const column = getNotificationSettingColumn(key);

  const { error } = await supabase
    .from('work_notification_settings')
    .upsert({
      profile_id: user.id,
      [column]: enabled,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'profile_id' });

  if (error) throw error;
  return next;
}
