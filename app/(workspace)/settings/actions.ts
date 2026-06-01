'use server';

import { revalidatePath } from 'next/cache';
import { updateMyNotificationSetting } from '@/lib/db/notification-settings';
import type { NotificationSettingKey } from '@/lib/notification-settings';

export async function updateNotificationSettingAction(
  key: NotificationSettingKey,
  enabled: boolean,
) {
  const settings = await updateMyNotificationSetting(key, enabled);
  revalidatePath('/settings');
  return settings;
}
