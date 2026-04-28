'use client';
import { useState } from 'react';
import { MessageSquare, Paperclip, Pin, FileSpreadsheet, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { getProfile } from '@/lib/mock-data';
import type { Post, Attachment } from '@/lib/types';

const ATTACH_ICON: Record<string, React.ElementType> = {
  xls: FileSpreadsheet, pdf: FileText, image: ImageIcon,
  doc: FileText, zip: File, other: File,
};

function AttachmentChip({ attachment }: { attachment: Attachment }) {
  const Icon = ATTACH_ICON[attachment.type] ?? File;
  return (
    <button className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--stone-100)] hover:bg-[var(--stone-200)] transition-colors border border-[var(--line)] text-[11px] text-[var(--stone-600)]">
      <Icon size={12} className="text-[var(--indigo-500)]" />
      <span className="font-medium">{attachment.name}</span>
      <span className="text-[10px] text-[var(--stone-400)]">{attachment.size}</span>
    </button>
  );
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

export default function PostCard({ post }: { post: Post }) {
  const [showComments, setShowComments] = useState(false);
  const author = getProfile(post.authorId)!;

  return (
    <article className="card animate-fade-up">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <Avatar initial={author.avatarInitial} color={author.avatarColor} size="md" />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-[var(--foreground)]">{author.name}</span>
              {author.role === 'admin' && <Badge variant="indigo">관리자</Badge>}
            </div>
            <div className="text-[11px] text-[var(--muted)]">{author.position} · {timeAgo(post.createdAt)}</div>
          </div>
        </div>
        {post.isPinned && <Pin size={13} className="text-[var(--indigo-500)] mt-0.5" />}
      </div>

      {/* Divider */}
      <div className="border-t mx-5" style={{ borderColor: 'var(--line)' }} />

      {/* Body */}
      <div className="px-5 py-3">
        {post.title && (
          <h2 className="text-[14px] font-bold text-[var(--foreground)] mb-1.5">{post.title}</h2>
        )}
        <p
          className="text-[13px] text-[var(--stone-700)] leading-relaxed whitespace-pre-line"
          dangerouslySetInnerHTML={{ __html: post.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
        />
        {post.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {post.attachments.map(a => <AttachmentChip key={a.id} attachment={a} />)}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t mx-5 pt-2 pb-3 flex items-center gap-2" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={() => setShowComments(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-[var(--stone-100)]"
          style={{ color: showComments ? 'var(--indigo-600)' : 'var(--muted)' }}
        >
          <MessageSquare size={13} />
          <span>댓글 {post.comments.length}개</span>
        </button>
        {post.attachments.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[var(--muted)]">
            <Paperclip size={13} />
            <span>첨부 {post.attachments.length}개</span>
          </span>
        )}
      </div>

      {/* Comments */}
      {showComments && post.comments.length > 0 && (
        <div className="border-t bg-[var(--stone-50)] rounded-b-[14px]" style={{ borderColor: 'var(--line)' }}>
          {post.comments.map(comment => {
            const ca = getProfile(comment.authorId)!;
            return (
              <div key={comment.id} className="px-5 py-3 flex gap-2.5 border-b last:border-0" style={{ borderColor: 'var(--line)' }}>
                <Avatar initial={ca.avatarInitial} color={ca.avatarColor} size="sm" />
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[12px] font-semibold text-[var(--foreground)]">{ca.name}</span>
                    <span className="text-[10px] text-[var(--muted)]">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-[12px] text-[var(--stone-700)]">{comment.content}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </article>
  );
}
