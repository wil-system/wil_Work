'use client';
import { useState } from 'react';
import { Plus, MoreHorizontal, Globe, Lock, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { addBoard } from '@/app/(workspace)/admin/boards/actions';
import type { Board } from '@/lib/types';

interface BoardAdminPanelProps {
  boards: Board[];
}

export default function BoardAdminPanel({ boards }: BoardAdminPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const result = await addBoard(new FormData(e.currentTarget));
    setSubmitting(false);
    if (result.success) {
      setShowForm(false);
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setShowForm(true)}
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

      {/* Add board modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--line)' }}>
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">게시판 추가</h2>
              <button onClick={() => { setShowForm(false); setError(''); }} className="p-1.5 rounded-lg hover:bg-[var(--stone-100)]">
                <X size={16} className="text-[var(--muted)]" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">
                  게시판 ID * <span className="normal-case font-normal text-[var(--muted)]">(영문, 고유한 슬러그)</span>
                </label>
                <input
                  type="text"
                  name="id"
                  required
                  placeholder="예: hr, design, finance"
                  pattern="[a-z0-9\-]+"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">게시판 이름 *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="예: 인사팀, 디자인팀"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">설명</label>
                <input
                  type="text"
                  name="description"
                  placeholder="게시판 설명 (선택)"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isPublic" id="isPublic" className="w-4 h-4 rounded accent-[var(--indigo-600)]" />
                <label htmlFor="isPublic" className="text-[13px] text-[var(--foreground)] cursor-pointer">전체 공개 게시판</label>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
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
                  {submitting ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
