import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/demo-mode';
import { mockNotifications } from '@/lib/mock-data';
import type { Notification } from '@/lib/types';

function toNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    type: row.type as Notification['type'],
    title: row.title as string,
    body: row.body as string,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
    link: row.link as string | undefined,
  };
}

export async function getMyNotifications(): Promise<Notification[]> {
  if (isDemoMode()) return mockNotifications;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('work_notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });
  return (data ?? []).map(toNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  if (isDemoMode()) return mockNotifications.filter(notification => !notification.isRead).length;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('work_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('is_read', false);
  return count ?? 0;
}

export async function markAllRead(): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('work_notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id);
}

export async function markNotificationRead(notificationId: string): Promise<Notification | null> {
  if (!notificationId) return null;

  if (isDemoMode()) {
    const notification = mockNotifications.find(item => item.id === notificationId) ?? null;
    if (notification) notification.isRead = true;
    return notification;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('work_notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id)
    .eq('id', notificationId)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data ? toNotification(data) : null;
}

export async function deleteReadNotifications(): Promise<void> {
  if (isDemoMode()) {
    for (let index = mockNotifications.length - 1; index >= 0; index -= 1) {
      if (mockNotifications[index].isRead) {
        mockNotifications.splice(index, 1);
      }
    }
    return;
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { error } = await supabase
    .from('work_notifications')
    .delete()
    .eq('profile_id', user.id)
    .eq('is_read', true);

  if (error) throw error;
}
