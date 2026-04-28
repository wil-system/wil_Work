import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { Mail, Building, Briefcase, Calendar } from 'lucide-react';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function ProfilePage() {
  const [user, unreadCount] = await Promise.all([
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);
  if (!user) redirect('/login');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="내 프로필" currentUser={user} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-xl">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
              style={{ background: user.avatarColor }}
            >
              {user.avatarInitial}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[var(--foreground)]">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'admin' ? 'indigo' : 'gray'}>
                  {user.role === 'admin' ? '관리자' : '멤버'}
                </Badge>
                <Badge variant="green">승인됨</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-3 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
            {[
              { icon: Mail,      label: '이메일', value: user.email },
              { icon: Building,  label: '부서',   value: user.department },
              { icon: Briefcase, label: '직책',   value: user.position },
              { icon: Calendar,  label: '입사일', value: user.joinedAt.replace(/-/g, '.') },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={15} className="text-[var(--muted)] flex-shrink-0" />
                <span className="text-[12px] text-[var(--muted)] w-16">{item.label}</span>
                <span className="text-[13px] text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--line)' }}>
            <button
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold border hover:bg-[var(--stone-50)] transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
            >
              프로필 수정
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
