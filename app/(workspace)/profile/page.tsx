import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import ProfileCard from '@/components/profile-card';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function ProfilePage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="내 프로필" currentUser={user} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-xl">
        <ProfileCard user={user} />
      </div>
    </div>
  );
}
