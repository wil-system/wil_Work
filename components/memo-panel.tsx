'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pin, Plus, Edit3, X, AlertCircle } from 'lucide-react';
import { Tag } from '@/components/ui/tag';
import { saveMemo } from '@/app/(workspace)/memo/actions';
import type { Memo } from '@/lib/types';

function MemoCard({ memo, onEdit }: { memo: Memo; onEdit: (memo: Memo) => void }) {
  return (
    <div className="card p-4 group cursor-pointer hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-[13px] font-bold text-[var(--foreground)]">{memo.title || '(제목 없음)'}</h3>
        <button
          onClick={e => { e.stopPropagation(); onEdit(memo); }}
          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--stone-100)] transition-all"
        >
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

interface MemoPanelProps {
  pinned: Memo[];
  rest: Memo[];
  isEmpty: boolean;
}

export default function MemoPanel({ pinned, rest, isEmpty }: MemoPanelProps) {
  const router = useRouter();
  const [editing, setEditing] = useState<Memo | 'new' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const result = await saveMemo(formData);
    setSubmitting(false);
    if (result.success) {
      setEditing(null);
      router.refresh();
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  }

  const isNew = editing === 'new';
  const editingMemo = editing !== null && editing !== 'new' ? editing : null;

  return (
    <>
      {/* New memo button */}
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setEditing('new')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all"
          style={{ background: 'var(--indigo-600)' }}
        >
          <Plus size={14} /> 새 메모
        </button>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="card p-12 text-center text-[var(--muted)] text-[13px]">아직 메모가 없습니다. 첫 번째 메모를 작성해보세요.</div>
      )}

      {/* Pinned memos */}
      {pinned.length > 0 && (
        <div className="mb-5">
          <div className="flex items-center gap-1.5 mb-3">
            <Pin size={13} className="text-[var(--indigo-500)]" />
            <span className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">고정됨</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {pinned.map(memo => <MemoCard key={memo.id} memo={memo} onEdit={setEditing} />)}
          </div>
        </div>
      )}

      {/* Regular memos */}
      {rest.length > 0 && (
        <div>
          <div className="text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide mb-3">메모</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rest.map(memo => <MemoCard key={memo.id} memo={memo} onEdit={setEditing} />)}
          </div>
        </div>
      )}

      {/* Modal overlay */}
      {editing !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-[92vw] max-w-lg bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">
                {isNew ? '새 메모' : '메모 편집'}
              </h2>
              <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg hover:bg-[var(--stone-100)]">
                <X size={16} className="text-[var(--muted)]" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {/* Hidden id for edit mode */}
              {editingMemo && <input type="hidden" name="id" value={editingMemo.id} />}

              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">제목</label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingMemo?.title ?? ''}
                  placeholder="메모 제목"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">내용</label>
                <textarea
                  name="content"
                  rows={6}
                  defaultValue={editingMemo?.content ?? ''}
                  placeholder="메모 내용을 작성하세요..."
                  className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">태그 (쉼표로 구분)</label>
                <input
                  type="text"
                  name="tags"
                  defaultValue={editingMemo?.tags.join(', ') ?? ''}
                  placeholder="기획, 개발, 마케팅"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="isPinnedCheck"
                  id="isPinnedCheck"
                  defaultChecked={editingMemo?.isPinned ?? false}
                  className="w-4 h-4 rounded accent-[var(--indigo-600)]"
                />
                <label htmlFor="isPinnedCheck" className="text-[13px] text-[var(--foreground)] cursor-pointer">고정 메모로 설정</label>
              </div>

              {error && (
                <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
                  <AlertCircle size={13} /> {error}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border hover:bg-[var(--stone-50)] transition-colors"
                  style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
                  style={{ background: 'var(--indigo-600)' }}
                >
                  {submitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
