import { createClient } from '@/lib/supabase/server';
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
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('work_notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id);
}
