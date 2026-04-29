import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import { getMyMemos } from '@/lib/db/memos';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import MemoPanel from '@/components/memo-panel';

export default async function MemoPage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const [memos, unreadCount] = await Promise.all([
    getMyMemos(user.id),
    getUnreadNotificationCount(),
  ]);

  const pinned = memos.filter(m => m.isPinned);
  const rest = memos.filter(m => !m.isPinned);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="메모장" subtitle="나만의 업무 메모를 관리하세요" currentUser={user} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <MemoPanel pinned={pinned} rest={rest} isEmpty={memos.length === 0} />
      </div>
    </div>
  );
}
