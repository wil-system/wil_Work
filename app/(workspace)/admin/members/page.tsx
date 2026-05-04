import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import { toggleMemberRole, updateMemberProfile } from './actions';

export default async function MembersPage() {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const [allProfiles, unreadCount] = await Promise.all([
    getAllProfiles(),
    getUnreadNotificationCount(),
  ]);

  const approved = allProfiles.filter(p => p.status === 'approved');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="회원 관리"
        subtitle={`전체 회원 ${approved.length}명`}
        breadcrumb={[{ label: '관리자' }, { label: '회원 관리' }]}
        currentUser={user}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="md:hidden space-y-3">
          {approved.map(member => (
            <div key={member.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar initial={member.avatarInitial} color={member.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--foreground)]">{member.name}</div>
                  <div className="text-[11px] text-[var(--muted)]">{member.email}</div>
                </div>
                <Badge variant={member.role === 'admin' ? 'indigo' : 'gray'}>
                  {member.role === 'admin' ? '관리자' : '회원'}
                </Badge>
              </div>
              <form action={updateMemberProfile} className="mt-3 grid grid-cols-2 gap-2">
                <input type="hidden" name="targetId" value={member.id} />
                <input
                  name="department"
                  defaultValue={member.department}
                  placeholder="부서"
                  className="rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)' }}
                />
                <input
                  name="position"
                  defaultValue={member.position}
                  placeholder="직책"
                  className="rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)' }}
                />
                <button type="submit" className="col-span-2 rounded-lg bg-[var(--stone-800)] px-3 py-2 text-[12px] font-semibold text-white">
                  부서/직책 저장
                </button>
              </form>
              {member.id !== user.id && (
                <form action={toggleMemberRole} className="mt-2">
                  <input type="hidden" name="targetId" value={member.id} />
                  <input type="hidden" name="currentRole" value={member.role} />
                  <button
                    type="submit"
                    className="w-full rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[var(--stone-50)]"
                    style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
                  >
                    {member.role === 'admin' ? '회원으로 변경' : '관리자로 변경'}
                  </button>
                </form>
              )}
            </div>
          ))}
        </div>

        <div className="hidden md:block card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                {['이름', '부서', '직책', '이메일', '권한', '가입일', '관리'].map(header => (
                  <th key={header} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {approved.map(member => (
                <tr key={member.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initial={member.avatarInitial} color={member.avatarColor} size="sm" />
                      <span className="text-[13px] font-semibold text-[var(--foreground)]">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <form id={`member-profile-${member.id}`} action={updateMemberProfile}>
                      <input type="hidden" name="targetId" value={member.id} />
                      <input
                        name="department"
                        defaultValue={member.department}
                        className="w-32 rounded-lg border px-2 py-1.5 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                        style={{ borderColor: 'var(--line)' }}
                      />
                    </form>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      form={`member-profile-${member.id}`}
                      name="position"
                      defaultValue={member.position}
                      className="w-32 rounded-lg border px-2 py-1.5 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-500)]">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={member.role === 'admin' ? 'indigo' : 'gray'}>
                      {member.role === 'admin' ? '관리자' : '회원'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--muted)]">{member.joinedAt.replace(/-/g, '.')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="submit"
                        form={`member-profile-${member.id}`}
                        className="rounded border px-2 py-1 text-[11px] transition-colors hover:bg-[var(--stone-50)]"
                        style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
                      >
                        저장
                      </button>
                      {member.id !== user.id && (
                        <form action={toggleMemberRole}>
                          <input type="hidden" name="targetId" value={member.id} />
                          <input type="hidden" name="currentRole" value={member.role} />
                          <button
                            type="submit"
                            className="rounded border px-2 py-1 text-[11px] transition-colors hover:bg-[var(--stone-50)]"
                            style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
                          >
                            {member.role === 'admin' ? '회원 전환' : '관리자 전환'}
                          </button>
                        </form>
                      )}
                    </div>
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
