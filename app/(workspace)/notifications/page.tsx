import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, UserCheck, LayoutDashboard, FileText, Bell } from 'lucide-react';
import { getMyNotifications, markAllRead } from '@/lib/db/notifications';
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

function NotifItem({ n }: { n: Notification }) {
  const Icon = TYPE_ICON[n.type] ?? Bell;
  return (
    <div
      className={`card p-4 flex items-start gap-3 ${!n.isRead ? 'border-l-2' : ''}`}
      style={!n.isRead ? { borderLeftColor: 'var(--indigo-500)' } : {}}
    >
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--indigo-50)' }}>
        <Icon size={14} className="text-[var(--indigo-500)]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[13px] font-semibold text-[var(--foreground)]">{n.title}</span>
          <Badge variant={TYPE_VARIANT[n.type]}>{TYPE_LABEL[n.type]}</Badge>
        </div>
        <p className="text-[12px] text-[var(--stone-600)]">{n.body}</p>
        <span className="text-[10px] text-[var(--stone-400)]">{timeAgo(n.createdAt)}</span>
      </div>
    </div>
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

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="알림" subtitle={`읽지 않은 알림 ${unread.length}개`} currentUser={user} unreadCount={unread.length} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl">
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
              {unread.map(n => <NotifItem key={n.id} n={n} />)}
            </div>
          </div>
        )}
        {read.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">읽음</div>
            <div className="space-y-2 opacity-60">
              {read.map(n => <NotifItem key={n.id} n={n} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
