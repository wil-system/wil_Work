import { redirect } from 'next/navigation';
import BoardSidebar from '@/components/board-sidebar';
import { SidebarProvider } from '@/components/sidebar-context';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getAccessibleBoards } from '@/lib/db/boards';
import { getMyNotificationSettings } from '@/lib/db/notification-settings';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');
  if (user.status === 'pending') redirect('/pending');

  const [boards, notificationSettings] = await Promise.all([
    getAccessibleBoards(user.id),
    getMyNotificationSettings(),
  ]);
  const canWriteWorkReport = true;
  const canReviewWorkReport = true;

  return (
    <SidebarProvider initialNotificationSettings={notificationSettings}>
      <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
        <BoardSidebar
          currentUser={user}
          boards={boards}
          canWriteWorkReport={canWriteWorkReport}
          canReviewWorkReport={canReviewWorkReport}
        />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </div>
      </div>
    </SidebarProvider>
  );
}
