'use client';
import { Paperclip, Send } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { getProfile, CURRENT_USER_ID } from '@/lib/mock-data';

export default function Composer() {
  const user = getProfile(CURRENT_USER_ID)!;
  return (
    <div className="card p-4">
      <div className="flex items-start gap-3">
        <Avatar initial={user.avatarInitial} color={user.avatarColor} size="md" />
        <div className="flex-1">
          <textarea
            placeholder="팀에 공유할 내용을 작성하세요..."
            rows={3}
            className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
            style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
          />
          <div className="flex items-center justify-between mt-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--stone-100)] transition-colors">
              <Paperclip size={13} />
              파일 첨부
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--indigo-600)' }}
            >
              <Send size={13} />
              게시
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
