import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, UserCheck, LayoutDashboard, FileText, Bell } from 'lucide-react';
import { getMyNotifications, markAllRead, markNotificationRead, deleteReadNotifications } from '@/lib/db/notifications';
import { getCurrentProfile } from '@/lib/db/profiles';
import type { Notification } from '@/lib/types';

const TYPE_ICON: Record<string, React.ElementType> = {
  comment: MessageSquare, approval: UserCheck, board: LayoutDashboard,
  report: FileText, mention: Bell,
};
const TYPE_VARIANT: Record<string, 'indigo' | 'green' | 'yellow' | 'gray'> = {
  comment: 'indigo', approval: 'yellow', board: 'green', report: 'gray', mention: 'indigo',
};
const TYPE_LABEL: Record<string, string> = {
  comment: '댓글', approval: '승인', board: '게시판', report: '보고', mention: '멘션',
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

function NotifItem({
  n,
  openNotificationAction,
}: {
  n: Notification;
  openNotificationAction: (formData: FormData) => Promise<void>;
}) {
  const Icon = TYPE_ICON[n.type] ?? Bell;
  return (
    <form action={openNotificationAction} className="block">
      <input type="hidden" name="notificationId" value={n.id} />
      <button
        type="submit"
        className={`card p-4 flex w-full items-start gap-3 text-left hover:bg-[var(--stone-50)] transition-colors ${!n.isRead ? 'border-l-2' : ''}`}
        aria-label={`${n.title} 알림 ${n.link ? '열기' : '읽음 처리'}`}
        style={!n.isRead ? { borderLeftColor: 'var(--indigo-500)' } : {}}
      >
        <span className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--indigo-50)' }}>
          <Icon size={14} className="text-[var(--indigo-500)]" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-[var(--foreground)]">{n.title}</span>
            <Badge variant={TYPE_VARIANT[n.type]}>{TYPE_LABEL[n.type]}</Badge>
          </span>
          <span className="block text-[12px] text-[var(--stone-600)]">{n.body}</span>
          <span className="text-[10px] text-[var(--stone-400)]">{timeAgo(n.createdAt)}</span>
        </span>
      </button>
    </form>
  );
}

export default async function NotificationsPage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const notifications = await getMyNotifications();

  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);

  async function markAllReadAction() {
    'use server';
    await markAllRead();
    revalidatePath('/notifications');
  }

  async function openNotificationAction(formData: FormData) {
    'use server';
    const notificationId = String(formData.get('notificationId') ?? '');
    const notification = await markNotificationRead(notificationId);
    revalidatePath('/notifications');
    if (notification?.link) redirect(notification.link);
  }

  async function deleteReadNotificationsAction() {
    'use server';
    await deleteReadNotifications();
    revalidatePath('/notifications');
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="알림" currentUser={user} unreadCount={unread.length} />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 max-w-2xl">
        {notifications.length === 0 && (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">알림이 없습니다.</div>
        )}
        {unread.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">읽지 않음</div>
              <form action={markAllReadAction}>
                <button type="submit" className="text-[11px] font-medium text-[var(--indigo-600)] hover:underline transition-colors">
                  모두 읽음 처리
                </button>
              </form>
            </div>
            <div className="space-y-2">
              {unread.map(n => <NotifItem key={n.id} n={n} openNotificationAction={openNotificationAction} />)}
            </div>
          </div>
        )}
        {read.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">읽음</div>
              <form action={deleteReadNotificationsAction}>
                <button type="submit" className="text-[11px] font-medium text-[var(--danger)] hover:underline transition-colors">
                  읽은 알림 삭제
                </button>
              </form>
            </div>
            <div className="space-y-2 opacity-60">
              {read.map(n => <NotifItem key={n.id} n={n} openNotificationAction={openNotificationAction} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
