import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal } from 'lucide-react';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function MembersPage() {
  const [allProfiles, user, unreadCount] = await Promise.all([
    getAllProfiles(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  const approved = allProfiles.filter(p => p.status === 'approved');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="회원 관리"
        subtitle={`전체 회원 ${approved.length}명`}
        breadcrumb={[{ label: '관리자' }, { label: '회원 관리' }]}
        currentUser={user!}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                {['이름', '부서', '직책', '이메일', '역할', '가입일', ''].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approved.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initial={u.avatarInitial} color={u.avatarColor} size="sm" />
                      <span className="text-[13px] font-semibold text-[var(--foreground)]">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-600)]">{u.department}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-600)]">{u.position}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-500)]">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.role === 'admin' ? 'indigo' : 'gray'}>
                      {u.role === 'admin' ? '관리자' : '멤버'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--muted)]">{u.joinedAt.replace(/-/g, '.')}</td>
                  <td className="px-4 py-3">
                    <button className="p-1 rounded hover:bg-[var(--stone-100)]">
                      <MoreHorizontal size={14} className="text-[var(--muted)]" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
