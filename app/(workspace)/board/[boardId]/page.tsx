import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import Topbar from '@/components/topbar';
import ChatFeed from '@/components/chat-feed';
import { getAllBoards, getBoardPermissionRole } from '@/lib/db/boards';
import { getBoardDateCounts, getBoardTaskPosts, getLatestBoardPosts, getPinnedBoardPosts } from '@/lib/db/posts';
import { getCurrentProfile, getAllProfiles } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import { OPERATIONS_TOOL_URL, shouldShowOperationsToolLink } from '@/lib/board-operations-link';

export default async function BoardPage({ params }: { params: Promise<{ boardId: string }> }) {
  const { boardId } = await params;

  const [boards, feedPage, pinnedPosts, dateCounts, user, allProfiles, unreadCount] = await Promise.all([
    getAllBoards(),
    getLatestBoardPosts(boardId, 20),
    boardId === 'notice' ? getPinnedBoardPosts(boardId) : getBoardTaskPosts(boardId),
    getBoardDateCounts(boardId),
    getCurrentProfile(),
    getAllProfiles(),
    getUnreadNotificationCount(),
  ]);

  const board = boards.find(b => b.id === boardId);
  if (!board) notFound();

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.id, p]));
  const currentBoardRole = user?.role === 'admin' ? 'leader' : await getBoardPermissionRole(user!.id, boardId);
  const showOperationsToolLink = shouldShowOperationsToolLink(board);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={board.name}
        breadcrumb={[{ label: '게시판' }, { label: board.name }]}
        currentUser={user!}
        unreadCount={unreadCount}
        actions={showOperationsToolLink ? (
          <a
            href={OPERATIONS_TOOL_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="운영툴 이동"
            className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 sm:px-3"
            style={{ background: 'var(--indigo-600)' }}
          >
            <ExternalLink size={14} />
            <span className="hidden sm:inline">운영툴 이동</span>
          </a>
        ) : undefined}
      />
      <div className="min-h-0 flex-1">
        <ChatFeed
          key={feedPage.posts.map(post => post.id).join(':')}
          boardId={boardId}
          variant={boardId === 'notice' ? 'notice' : 'business'}
          canCreatePost={boardId !== 'notice' || user!.role === 'admin'}
          initialPosts={feedPage.posts}
          initialPinnedPosts={pinnedPosts}
          initialHasMoreOlder={feedPage.hasMore}
          dateCounts={dateCounts}
          currentUserId={user!.id}
          currentUserProfile={profileMap[user!.id]}
          currentBoardRole={currentBoardRole}
          profiles={profileMap}
        />
      </div>
    </div>
  );
}
