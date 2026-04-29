import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import BoardAdminPanel from '@/components/board-admin-panel';
import { getAllBoards } from '@/lib/db/boards';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function BoardsAdminPage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const [boards, unreadCount] = await Promise.all([
    getAllBoards(),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="게시판 관리"
        subtitle="게시판을 추가하고 설정하세요"
        breadcrumb={[{ label: '관리자' }, { label: '게시판 관리' }]}
        currentUser={user}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl">
        <BoardAdminPanel boards={boards} />
      </div>
    </div>
  );
}
