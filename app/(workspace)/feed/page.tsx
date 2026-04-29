import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import ChatFeed from '@/components/chat-feed';
import { getPostsForBoard } from '@/lib/db/posts';
import { getCurrentProfile, getAllProfiles } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function FeedPage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const [posts, allProfiles, unreadCount] = await Promise.all([
    getPostsForBoard('feed'),
    getAllProfiles(),
    getUnreadNotificationCount(),
  ]);

  const profileMap = Object.fromEntries(allProfiles.map(p => [p.id, p]));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="전체 피드"
        subtitle="WIL 팀 채팅"
        currentUser={user}
        unreadCount={unreadCount}
      />
      <ChatFeed
        posts={[...posts].reverse()}
        currentUserId={user.id}
        currentUserProfile={profileMap[user.id]}
        profiles={profileMap}
      />
    </div>
  );
}
