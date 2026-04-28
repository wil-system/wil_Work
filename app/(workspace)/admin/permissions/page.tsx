import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Check } from 'lucide-react';
import { mockProfiles, mockBoards, mockBoardPermissions } from '@/lib/mock-data';

export default function PermissionsPage() {
  const members = mockProfiles.filter(p => p.status === 'approved' && p.role === 'member');
  const boards = mockBoards.filter(b => !b.isPublic);

  const hasPermission = (userId: string, boardId: string) =>
    mockBoardPermissions.some(p => p.profileId === userId && p.boardId === boardId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="권한 관리"
        subtitle="게시판별 접근 권한을 설정하세요"
        breadcrumb={[{ label: '관리자' }, { label: '권한 관리' }]}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">멤버</th>
                {boards.map(b => (
                  <th key={b.id} className="text-center px-3 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                    {b.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(user => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initial={user.avatarInitial} color={user.avatarColor} size="sm" />
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">{user.name}</div>
                        <div className="text-[10px] text-[var(--muted)]">{user.department}</div>
                      </div>
                    </div>
                  </td>
                  {boards.map(board => (
                    <td key={board.id} className="text-center px-3 py-3">
                      <button
                        className="w-6 h-6 rounded flex items-center justify-center mx-auto transition-all hover:opacity-80"
                        style={{ background: hasPermission(user.id, board.id) ? 'var(--indigo-500)' : 'var(--stone-200)' }}
                      >
                        {hasPermission(user.id, board.id) && <Check size={12} className="text-white" />}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-3">
          클릭하면 권한을 토글할 수 있습니다. 관리자는 모든 게시판에 자동 접근 권한이 있습니다.
        </p>
      </div>
    </div>
  );
}
