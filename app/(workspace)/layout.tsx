import { redirect } from 'next/navigation';
import BoardSidebar from '@/components/board-sidebar';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getAccessibleBoards } from '@/lib/db/boards';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');
  if (user.status === 'pending') redirect('/pending');

  const boards = await getAccessibleBoards(user.id);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <BoardSidebar currentUser={user} boards={boards} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
