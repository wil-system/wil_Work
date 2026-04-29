import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import { getMonthEvents } from '@/lib/db/calendar';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import CalendarClient from '@/components/calendar-client';

export default async function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const [events, unreadCount] = await Promise.all([
    getMonthEvents(year, month),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="캘린더" subtitle="일정을 관리하세요" currentUser={user} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <CalendarClient
          initialYear={year}
          initialMonth={month}
          initialEvents={events}
        />
      </div>
    </div>
  );
}
