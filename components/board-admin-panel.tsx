'use client';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle, Dot, Globe, GripVertical, Lock, Plus, RotateCcw, Save, Trash2, X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { addBoard, removeBoard, saveBoardSettings } from '@/app/(workspace)/admin/boards/actions';
import type { Board } from '@/lib/types';

interface BoardAdminPanelProps {
  boards: Board[];
}

export default function BoardAdminPanel({ boards }: BoardAdminPanelProps) {
  const menuBoards = useMemo(() => {
    const editableBoards = boards.filter(board => board.id !== 'feed');
    return [
      ...editableBoards.filter(board => board.id === 'notice'),
      ...editableBoards.filter(board => board.id !== 'notice'),
    ];
  }, [boards]);
  const [items, setItems] = useState(menuBoards);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setItems(menuBoards);
  }, [menuBoards]);

  const hasChanges = items.some((item, index) => {
    const original = menuBoards[index];
    return !original ||
      original.id !== item.id ||
      original.name !== item.name ||
      original.isPublic !== item.isPublic;
  });

  function moveBoard(fromId: string, toId: string) {
    if (fromId === toId || fromId === 'notice' || toId === 'notice') return;
    setItems(current => {
      const fromIndex = current.findIndex(item => item.id === fromId);
      const toIndex = current.findIndex(item => item.id === toId);
      if (fromIndex < 0 || toIndex < 0) return current;

      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
    setSaved(false);
  }

  function renameBoard(id: string, name: string) {
    setItems(current => current.map(item => item.id === id ? { ...item, name } : item));
    setSaved(false);
  }

  function toggleVisibility(id: string) {
    setItems(current => current.map(item => (
      item.id === id ? { ...item, isPublic: !item.isPublic } : item
    )));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    const result = await saveBoardSettings(items.map(({ id, name, isPublic }) => ({ id, name, isPublic })));
    setSaving(false);

    if (result.success) {
      setSaved(true);
    } else {
      setError(result.error ?? '게시판 설정을 저장하지 못했습니다.');
    }
  }

  async function handleDelete(board: Board) {
    if (board.id === 'notice') return;
    const confirmed = window.confirm(`"${board.name}" 게시판을 삭제할까요?\n게시판의 게시글, 댓글, 첨부 기록도 함께 삭제됩니다.`);
    if (!confirmed) return;

    setDeletingId(board.id);
    setError('');
    setSaved(false);
    const result = await removeBoard(board.id);
    setDeletingId(null);

    if (result.success) {
      setItems(current => current.filter(item => item.id !== board.id));
      setSaved(true);
    } else {
      setError(result.error ?? '게시판을 삭제하지 못했습니다.');
    }
  }

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div />
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setItems(menuBoards); setError(''); setSaved(false); }}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[var(--stone-50)] disabled:opacity-50"
            style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
          >
            <RotateCcw size={13} /> 되돌리기
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
            style={{ background: 'var(--indigo-600)' }}
          >
            <Save size={13} /> {saving ? '저장 중...' : '저장'}
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90"
            style={{ background: 'var(--stone-800)' }}
          >
            <Plus size={13} /> 추가
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        {items.map((board, i) => (
          <div
            key={board.id}
            draggable={board.id !== 'notice'}
            onDragStart={() => {
              if (board.id !== 'notice') setDraggedId(board.id);
            }}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              if (draggedId) moveBoard(draggedId, board.id);
              setDraggedId(null);
            }}
            onDragEnd={() => setDraggedId(null)}
            className={`flex items-center gap-3 px-4 py-3 transition-colors ${i < items.length - 1 ? 'border-b' : ''} ${draggedId === board.id ? 'bg-[var(--stone-50)] opacity-70' : ''}`}
            style={{ borderColor: 'var(--line)' }}
          >
            <div className={`rounded p-1 text-[var(--stone-400)] ${board.id === 'notice' ? '' : 'cursor-grab active:cursor-grabbing'}`}>
              <GripVertical size={16} />
            </div>
            <Dot size={18} className="text-[var(--stone-400)]" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <input
                  value={board.name}
                  onChange={e => renameBoard(board.id, e.target.value)}
                  className="min-w-0 flex-1 rounded-md border bg-white px-2 py-1.5 text-[13px] font-bold text-[var(--foreground)] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)' }}
                />
                <button
                  type="button"
                  onClick={() => toggleVisibility(board.id)}
                  className="shrink-0"
                  aria-label={`${board.name} 공개 범위 변경`}
                >
                  <Badge variant={board.isPublic ? 'green' : 'gray'}>
                    {board.isPublic ? '전체 공개' : '비공개'}
                  </Badge>
                </button>
              </div>
              <div className="mt-1 text-[11px] text-[var(--muted)]">{board.description}</div>
            </div>
            {board.isPublic
              ? <Globe size={14} className="text-[var(--success)]" />
              : <Lock size={14} className="text-[var(--muted)]" />
            }
            <button
              type="button"
              onClick={() => handleDelete(board)}
              disabled={board.id === 'notice' || deletingId === board.id}
              className="rounded-lg p-2 text-[var(--stone-400)] transition-colors hover:bg-[#fee2e2] hover:text-[var(--danger)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[var(--stone-400)]"
              aria-label={`${board.name} 삭제`}
              title={board.id === 'notice' ? '공지사항은 삭제할 수 없습니다' : '게시판 삭제'}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      {(error || saved) && (
        <div className={`mt-3 rounded-lg px-3 py-2 text-[12px] ${error ? 'bg-[#fee2e2] text-[var(--danger)]' : 'bg-[#d1fae5] text-[#065f46]'}`}>
          {error || '게시판 설정을 저장했습니다.'}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-[92vw] max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4" style={{ borderColor: 'var(--line)' }}>
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">게시판 추가</h2>
              <button onClick={() => { setShowForm(false); setError(''); }} className="rounded-lg p-1.5 hover:bg-[var(--stone-100)]">
                <X size={16} className="text-[var(--muted)]" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4 p-6">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">
                  게시판 ID * <span className="normal-case font-normal text-[var(--muted)]">영문, 숫자, 하이픈</span>
                </label>
                <input
                  type="text"
                  name="id"
                  required
                  placeholder="예: finance"
                  pattern="[a-z0-9\-]+"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">게시판 이름 *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="예: 재무팀"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">설명</label>
                <input
                  type="text"
                  name="description"
                  placeholder="게시판 설명"
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" name="isPublic" id="isPublic" className="h-4 w-4 rounded accent-[var(--indigo-600)]" />
                <label htmlFor="isPublic" className="cursor-pointer text-[13px] text-[var(--foreground)]">전체 공개 게시판</label>
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-[#fee2e2] px-3 py-2 text-[12px] text-[var(--danger)]">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setError(''); }}
                  className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium transition-colors hover:bg-[var(--stone-50)]"
                  style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
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
