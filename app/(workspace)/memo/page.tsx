import Topbar from '@/components/topbar';
import { Tag } from '@/components/ui/tag';
import { Pin, Plus, Edit3 } from 'lucide-react';
import { getMyMemos } from '@/lib/db/memos';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import type { Memo } from '@/lib/types';

function MemoCard({ memo }: { memo: Memo }) {
  return (
    <div className="card p-4 group cursor-pointer hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-[13px] font-bold text-[var(--foreground)]">{memo.title}</h3>
        <button className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--stone-100)] transition-all">
          <Edit3 size={12} className="text-[var(--muted)]" />
        </button>
      </div>
      <p className="text-[12px] text-[var(--stone-600)] whitespace-pre-line line-clamp-4 mb-3">{memo.content}</p>
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {memo.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </div>
        <span className="text-[10px] text-[var(--stone-400)]">{memo.updatedAt.slice(0, 10).replace(/-/g, '.')}</span>
      </div>
    </div>
  );
}

export default async function MemoPage() {
  const user = await getCurrentProfile();
  const [memos, unreadCount] = await Promise.all([
    getMyMemos(user!.id),
    getUnreadNotificationCount(),
  ]);

  const pinned = memos.filter(m => m.isPinned);
  const rest = memos.filter(m => !m.isPinned);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="메모장" subtitle="나만의 업무 메모를 관리하세요" currentUser={user!} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex justify-end mb-4">
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--indigo-600)' }}>
            <Plus size={14} /> 새 메모
          </button>
        </div>

        {memos.length === 0 && (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">아직 메모가 없습니다. 첫 번째 메모를 작성해보세요.</div>
        )}

        {pinned.length > 0 && (
          <div className="mb-5">
            <div className="flex items-center gap-1.5 mb-3">
              <Pin size={13} className="text-[var(--indigo-500)]" />
              <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">고정됨</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {pinned.map(memo => <MemoCard key={memo.id} memo={memo} />)}
            </div>
          </div>
        )}

        {rest.length > 0 && (
          <div>
            <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">메모</div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {rest.map(memo => <MemoCard key={memo.id} memo={memo} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
