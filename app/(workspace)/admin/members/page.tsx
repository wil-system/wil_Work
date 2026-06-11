import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import MembersAdminPanel from '@/components/members-admin-panel';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function MembersPage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const [allProfiles, unreadCount] = await Promise.all([
    getAllProfiles(),
    getUnreadNotificationCount(),
  ]);

  const approved = allProfiles.filter(p => p.status === 'approved');
  const memberPanelKey = approved
    .map(member => `${member.id}:${member.department}:${member.position}:${member.role}`)
    .join('|');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="회원 관리"
        breadcrumb={[{ label: '관리자' }, { label: '회원 관리' }]}
        currentUser={user}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <MembersAdminPanel key={memberPanelKey} members={approved} currentUserId={user.id} />
      </div>
    </div>
  );
}
