import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import SettingsPanel from '@/components/settings-panel';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function SettingsPage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');
  const unreadCount = await getUnreadNotificationCount();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="설정" currentUser={user} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 max-w-xl">
        <SettingsPanel />
      </div>
    </div>
  );
}
