import { notFound } from 'next/navigation';
import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { getAllBoards } from '@/lib/db/boards';
import { getPostsForBoard } from '@/lib/db/posts';
import { getCurrentProfile, getAllProfiles } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function BoardPage({ params }: { params: { boardId: string } }) {
  const [boards, posts, user, allProfiles, unreadCount] = await Promise.all([
    getAllBoards(),
    getPostsForBoard(params.boardId),
    getCurrentProfile(),
    getAllProfiles(),
    getUnreadNotificationCount(),
  ]);

  const board = boards.find(b => b.id === params.boardId);
  if (!board) notFound();

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.id, p]));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={board.name}
        subtitle={board.description}
        breadcrumb={[{ label: '게시판' }, { label: board.name }]}
        currentUser={user!}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Composer boardId={params.boardId} authorId={user!.id} authorInitial={user!.avatarInitial} authorColor={user!.avatarColor} />
        {posts.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">
            아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post.id}
              post={post}
              profiles={profileMap}
              currentUserId={user!.id}
              currentUserProfile={profileMap[user!.id]}
            />
          ))
        )}
      </div>
    </div>
  );
}
