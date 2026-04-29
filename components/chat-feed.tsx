'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Pin, FileSpreadsheet, FileText, Image as ImageIcon, File, MessageSquare, ChevronDown } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { createClient } from '@/lib/supabase/client';
import type { Post, Attachment } from '@/lib/types';

type ProfileInfo = { name: string; position: string; role: string; avatarInitial: string; avatarColor: string };

interface ChatFeedProps {
  posts: Post[];
  currentUserId: string;
  currentUserProfile: ProfileInfo;
  profiles: Record<string, ProfileInfo>;
}

const ATTACH_ICON: Record<string, React.ElementType> = {
  xls: FileSpreadsheet, pdf: FileText, image: ImageIcon,
  doc: FileText, zip: File, other: File,
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDateLabel(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '오늘';
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function AttachChip({ a }: { a: Attachment }) {
  const Icon = ATTACH_ICON[a.type] ?? File;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border"
      style={{ background: 'var(--stone-50)', borderColor: 'var(--line)', color: 'var(--stone-600)' }}>
      <Icon size={11} style={{ color: 'var(--indigo-500)' }} />
      <span className="font-medium">{a.name}</span>
      <span style={{ color: 'var(--stone-400)' }}>{a.size}</span>
    </span>
  );
}

function ThreadPanel({
  post, profiles, currentUserId, currentUserProfile,
}: {
  post: Post;
  profiles: Record<string, ProfileInfo>;
  currentUserId: string;
  currentUserProfile: ProfileInfo;
}) {
  const router = useRouter();
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('work_comments').insert({
        post_id: post.id,
        author_id: currentUserId,
        content: reply.trim(),
      });
      if (!error) { setReply(''); router.refresh(); }
    } finally { setSending(false); }
  }

  return (
    <div className="ml-10 mt-1 rounded-xl border overflow-hidden"
      style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
      {post.comments.map(c => {
        const ca = profiles[c.authorId] ?? { name: '알 수 없음', avatarInitial: '?', avatarColor: '#999', position: '', role: 'member' };
        return (
          <div key={c.id} className="flex gap-2.5 px-3 py-2.5 border-b last:border-0"
            style={{ borderColor: 'var(--line)' }}>
            <Avatar initial={ca.avatarInitial} color={ca.avatarColor} size="sm" />
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>{ca.name}</span>
                <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{formatTime(c.createdAt)}</span>
              </div>
              <p className="text-[12px]" style={{ color: 'var(--stone-700)' }}>{c.content}</p>
            </div>
          </div>
        );
      })}
      <form onSubmit={handleReply} className="flex items-center gap-2 px-3 py-2 border-t"
        style={{ borderColor: 'var(--line)' }}>
        <Avatar initial={currentUserProfile.avatarInitial} color={currentUserProfile.avatarColor} size="sm" />
        <input
          type="text"
          value={reply}
          onChange={e => setReply(e.target.value)}
          placeholder="답글 입력..."
          className="flex-1 px-2.5 py-1.5 rounded-lg border text-[12px] outline-none"
          style={{ borderColor: 'var(--line)', background: 'white' }}
          onFocus={e => (e.currentTarget.style.borderColor = 'var(--indigo-500)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'var(--line)')}
        />
        <button type="submit" disabled={!reply.trim() || sending}
          className="p-1.5 rounded-lg disabled:opacity-30 transition-colors"
          style={{ color: 'var(--indigo-600)' }}>
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}

function ChatMessage({
  post, isGrouped, showDateSep, profiles, currentUserId, currentUserProfile,
}: {
  post: Post;
  isGrouped: boolean;
  showDateSep: boolean;
  profiles: Record<string, ProfileInfo>;
  currentUserId: string;
  currentUserProfile: ProfileInfo;
}) {
  const [threadOpen, setThreadOpen] = useState(false);
  const author = profiles[post.authorId] ?? { name: '알 수 없음', position: '', role: 'member', avatarInitial: '?', avatarColor: '#999' };

  return (
    <>
      {showDateSep && (
        <div className="flex items-center gap-3 py-4">
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          <span className="text-[11px] font-semibold px-2" style={{ color: 'var(--stone-400)' }}>
            {formatDateLabel(post.createdAt)}
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        </div>
      )}

      <div className={`group flex gap-3 px-2 py-0.5 rounded-xl transition-colors hover:bg-[var(--stone-50)] ${isGrouped ? '' : 'mt-4'}`}>
        {/* Avatar column — always 36px wide for alignment */}
        <div className="w-9 flex-shrink-0 flex items-start justify-center pt-0.5">
          {!isGrouped
            ? <Avatar initial={author.avatarInitial} color={author.avatarColor} size="sm" />
            : <span className="text-[10px] opacity-0 group-hover:opacity-60 transition-opacity select-none pt-1.5"
                style={{ color: 'var(--muted)' }}>
                {formatTime(post.createdAt).split(' ')[1]}
              </span>
          }
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {!isGrouped && (
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{author.name}</span>
              {author.role === 'admin' && <Badge variant="indigo">관리자</Badge>}
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{formatTime(post.createdAt)}</span>
              {post.isPinned && <Pin size={11} style={{ color: 'var(--indigo-500)' }} />}
            </div>
          )}

          {post.title && (
            <p className="text-[13px] font-semibold mb-0.5" style={{ color: 'var(--foreground)' }}>{post.title}</p>
          )}
          <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--stone-700)' }}
            dangerouslySetInnerHTML={{ __html: post.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
          />

          {post.attachments.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              {post.attachments.map(a => <AttachChip key={a.id} a={a} />)}
            </div>
          )}

          {/* Thread toggle */}
          {(post.comments.length > 0 || true) && (
            <button
              onClick={() => setThreadOpen(o => !o)}
              className="flex items-center gap-1.5 mt-1.5 text-[11px] font-medium transition-colors hover:underline"
              style={{ color: threadOpen ? 'var(--indigo-600)' : 'var(--stone-400)' }}
            >
              <MessageSquare size={12} />
              <span>
                {post.comments.length > 0
                  ? `${post.comments.length}개 답글`
                  : '답글'}
              </span>
              <ChevronDown size={11} className={`transition-transform ${threadOpen ? 'rotate-180' : ''}`} />
            </button>
          )}

          {threadOpen && (
            <ThreadPanel
              post={post}
              profiles={profiles}
              currentUserId={currentUserId}
              currentUserProfile={currentUserProfile}
            />
          )}
        </div>
      </div>
    </>
  );
}

export default function ChatFeed({ posts, currentUserId, currentUserProfile, profiles }: ChatFeedProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const supabase = createClient();
      await supabase.from('work_posts').insert({
        board_id: 'feed',
        author_id: currentUserId,
        content: message.trim(),
      });
      setMessage('');
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      router.refresh();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setSending(false);
    }
  }

  // Group consecutive messages from same author within 5 min
  const grouped = posts.map((post, i) => {
    const prev = posts[i - 1];
    const sameAuthor = prev?.authorId === post.authorId;
    const within5min = prev
      ? new Date(post.createdAt).getTime() - new Date(prev.createdAt).getTime() < 5 * 60 * 1000
      : false;
    const diffDay = !prev || new Date(post.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
    return {
      ...post,
      isGrouped: sameAuthor && within5min && !diffDay,
      showDateSep: diffDay,
    };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Message list — scrollable, bottom-anchored */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-4 pb-2">
          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-3"
                style={{ background: 'var(--indigo-50)' }}>
                <MessageSquare size={22} style={{ color: 'var(--indigo-500)' }} />
              </div>
              <p className="text-[14px] font-semibold" style={{ color: 'var(--foreground)' }}>아직 메시지가 없습니다</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--muted)' }}>첫 메시지를 입력해 대화를 시작해보세요</p>
            </div>
          )}
          {grouped.map(post => (
            <ChatMessage
              key={post.id}
              post={post}
              isGrouped={post.isGrouped}
              showDateSep={post.showDateSep}
              profiles={profiles}
              currentUserId={currentUserId}
              currentUserProfile={currentUserProfile}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input bar — sticky at bottom */}
      <div className="flex-shrink-0 border-t px-3 sm:px-6 py-3"
        style={{ borderColor: 'var(--line)', background: 'var(--bg-surface)' }}>
        <form onSubmit={handleSend} className="max-w-3xl mx-auto flex items-end gap-3">
          <Avatar
            initial={currentUserProfile.avatarInitial}
            color={currentUserProfile.avatarColor}
            size="sm"
          />
          <div className="flex-1 flex items-end rounded-xl border overflow-hidden transition-colors focus-within:border-[var(--indigo-400)]"
            style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
            <textarea
              ref={textareaRef}
              value={message}
              rows={1}
              onChange={e => { setMessage(e.target.value); autoResize(); }}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e as unknown as React.FormEvent);
                }
              }}
              placeholder="메시지 입력... (Enter 전송, Shift+Enter 줄바꿈)"
              className="flex-1 px-4 py-2.5 text-[13px] outline-none resize-none bg-transparent"
              style={{ color: 'var(--foreground)', minHeight: '40px' }}
            />
            <button
              type="submit"
              disabled={!message.trim() || sending}
              className="p-2.5 m-1 rounded-lg flex-shrink-0 disabled:opacity-30 transition-all"
              style={{ background: message.trim() ? 'var(--indigo-600)' : 'transparent', color: message.trim() ? 'white' : 'var(--stone-400)' }}
            >
              <Send size={14} />
            </button>
          </div>
        </form>
        <p className="text-center text-[10px] mt-1.5 max-w-3xl mx-auto" style={{ color: 'var(--stone-400)' }}>
          전체 피드 — WIL 팀 채팅
        </p>
      </div>
    </div>
  );
}
