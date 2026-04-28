'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, Send } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { createClient } from '@/lib/supabase/client';

interface ComposerProps {
  boardId: string;
  authorId: string;
  authorInitial?: string;
  authorColor?: string;
}

export default function Composer({ boardId, authorId, authorInitial = '?', authorColor = '#1e1b4b' }: ComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('work_posts').insert({
      board_id: boardId,
      author_id: authorId,
      content: content.trim(),
    });
    setContent('');
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <Avatar initial={authorInitial} color={authorColor} size="md" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="팀에 공유할 내용을 작성하세요..."
              rows={3}
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
            <div className="flex items-center justify-between mt-2">
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--stone-100)] transition-colors">
                <Paperclip size={13} /> 파일 첨부
              </button>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--indigo-600)' }}
              >
                <Send size={13} /> {submitting ? '게시 중...' : '게시'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
