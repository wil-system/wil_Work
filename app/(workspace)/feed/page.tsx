import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { getPostsForBoard } from '@/lib/mock-data';

export default function FeedPage() {
  const posts = getPostsForBoard('feed');
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="전체 피드" subtitle="오늘 업무 현황을 확인하세요" />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Composer />
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
