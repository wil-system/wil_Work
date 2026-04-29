import { revalidatePath } from 'next/cache';
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Check } from 'lucide-react';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getAllBoards, getAllBoardPermissions, toggleBoardPermission } from '@/lib/db/boards';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

async function handleToggle(formData: FormData) {
  'use server';
  const profileId = formData.get('profileId') as string;
  const boardId = formData.get('boardId') as string;
  const has = formData.get('has') === 'true';
  await toggleBoardPermission(profileId, boardId, !has);
  revalidatePath('/admin/permissions');
}

export default async function PermissionsPage() {
  const [allProfiles, boards, permissions, user, unreadCount] = await Promise.all([
    getAllProfiles(),
    getAllBoards(),
    getAllBoardPermissions(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  const members = allProfiles.filter(p => p.status === 'approved' && p.role === 'member');
  const privateBoards = boards.filter(b => !b.isPublic);

  const hasPermission = (userId: string, boardId: string) =>
    permissions.some(p => p.profileId === userId && p.boardId === boardId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="권한 관리"
        subtitle="게시판별 접근 권한을 설정하세요"
        breadcrumb={[{ label: '관리자' }, { label: '권한 관리' }]}
        currentUser={user!}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="card overflow-x-auto">
          <div className="min-w-max">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">멤버</th>
                {privateBoards.map(b => (
                  <th key={b.id} className="text-center px-3 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                    {b.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initial={u.avatarInitial} color={u.avatarColor} size="sm" />
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">{u.name}</div>
                        <div className="text-[10px] text-[var(--muted)]">{u.department}</div>
                      </div>
                    </div>
                  </td>
                  {privateBoards.map(board => {
                    const has = hasPermission(u.id, board.id);
                    return (
                      <td key={board.id} className="text-center px-3 py-3">
                        <form action={handleToggle}>
                          <input type="hidden" name="profileId" value={u.id} />
                          <input type="hidden" name="boardId" value={board.id} />
                          <input type="hidden" name="has" value={String(has)} />
                          <button
                            type="submit"
                            className="w-6 h-6 rounded flex items-center justify-center mx-auto transition-all hover:opacity-80"
                            style={{ background: has ? 'var(--indigo-500)' : 'var(--stone-200)' }}
                          >
                            {has && <Check size={12} className="text-white" />}
                          </button>
                        </form>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-3">
          클릭하면 권한을 토글할 수 있습니다. 관리자는 모든 게시판에 자동 접근 권한이 있습니다.
        </p>
      </div>
    </div>
  );
}
