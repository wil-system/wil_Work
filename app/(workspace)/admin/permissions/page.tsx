import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import PermissionsAdminPanel from '@/components/permissions-admin-panel';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getAllBoards, getAllBoardPermissions } from '@/lib/db/boards';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function PermissionsPage() {
  const [allProfiles, boards, permissions, user, unreadCount] = await Promise.all([
    getAllProfiles(),
    getAllBoards(),
    getAllBoardPermissions(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  const members = allProfiles.filter(profile => profile.status === 'approved' && profile.role !== 'admin');
  const editableBoards = boards.filter(board => board.id !== 'feed' && board.id !== 'notice');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="권한 관리"
        subtitle="게시판별 접근 허용과 직급을 지정합니다"
        breadcrumb={[{ label: '관리자' }, { label: '권한 관리' }]}
        currentUser={user!}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <PermissionsAdminPanel
          members={members}
          boards={editableBoards}
          permissions={permissions}
        />
        <div className="mt-3 flex items-center gap-2 text-[11px] text-[var(--muted)]">
          <Badge variant="indigo">관리자</Badge>
          <span>관리자는 모든 게시판에 접근하며, 허용/직급 지정 대상에서 제외됩니다.</span>
        </div>
      </div>
    </div>
  );
}
