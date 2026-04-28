import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { Plus, MoreHorizontal, Globe, Lock } from 'lucide-react';
import { getAllBoards } from '@/lib/db/boards';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function BoardsAdminPage() {
  const [boards, user, unreadCount] = await Promise.all([
    getAllBoards(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="게시판 관리"
        subtitle="게시판을 추가하고 설정하세요"
        breadcrumb={[{ label: '관리자' }, { label: '게시판 관리' }]}
        currentUser={user!}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl">
        <div className="flex justify-end mb-4">
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'var(--indigo-600)' }}
          >
            <Plus size={14} /> 게시판 추가
          </button>
        </div>
        <div className="card overflow-hidden">
          {boards.map((board, i) => (
            <div
              key={board.id}
              className={`flex items-center gap-4 px-5 py-4 ${i < boards.length - 1 ? 'border-b' : ''}`}
              style={{ borderColor: 'var(--line)' }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-bold text-[var(--foreground)]">{board.name}</span>
                  <Badge variant={board.isPublic ? 'green' : 'gray'}>
                    {board.isPublic ? '전체 공개' : '권한 필요'}
                  </Badge>
                </div>
                <div className="text-[11px] text-[var(--muted)] mt-0.5">{board.description}</div>
              </div>
              <div className="flex items-center gap-2">
                {board.isPublic
                  ? <Globe size={13} className="text-[var(--success)]" />
                  : <Lock size={13} className="text-[var(--muted)]" />
                }
                <button className="p-1.5 rounded hover:bg-[var(--stone-100)] transition-colors">
                  <MoreHorizontal size={15} className="text-[var(--muted)]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
