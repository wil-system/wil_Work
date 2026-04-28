import { notFound } from 'next/navigation';
import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { mockBoards, getPostsForBoard } from '@/lib/mock-data';

export default function BoardPage({ params }: { params: { boardId: string } }) {
  const board = mockBoards.find(b => b.id === params.boardId);
  if (!board) notFound();
  const posts = getPostsForBoard(params.boardId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title={board.name}
        subtitle={board.description}
        breadcrumb={[{ label: '게시판' }, { label: board.name }]}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Composer />
        {posts.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">
            아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.
          </div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
