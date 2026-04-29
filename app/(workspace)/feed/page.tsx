import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { getPostsForBoard } from '@/lib/db/posts';
import { getCurrentProfile, getAllProfiles } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function FeedPage() {
  const [posts, user, allProfiles, unreadCount] = await Promise.all([
    getPostsForBoard('feed'),
    getCurrentProfile(),
    getAllProfiles(),
    getUnreadNotificationCount(),
  ]);

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.id, p]));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="전체 피드" subtitle="오늘 업무 현황을 확인하세요" currentUser={user!} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5 space-y-4">
        <Composer boardId="feed" authorId={user!.id} authorInitial={user!.avatarInitial} authorColor={user!.avatarColor} />
        {posts.map(post => (
          <PostCard
            key={post.id}
            post={post}
            profiles={profileMap}
            currentUserId={user!.id}
            currentUserProfile={profileMap[user!.id]}
          />
        ))}
      </div>
    </div>
  );
}
