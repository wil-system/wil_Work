'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send, Pin, FileSpreadsheet, FileText, Image as ImageIcon,
  File, MessageSquare, ChevronDown, Paperclip, X as XIcon,
} from 'lucide-react';
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

// ── Helpers ────────────────────────────────────────────────────────────────

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

function detectType(file: File): Attachment['type'] {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (['doc', 'docx'].includes(ext)) return 'doc';
  if (['xls', 'xlsx'].includes(ext)) return 'xls';
  if (['zip', 'rar', '7z'].includes(ext)) return 'zip';
  return 'other';
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

// ── AttachmentChip ──────────────────────────────────────────────────────────

function AttachChip({ a }: { a: Attachment }) {
  const Icon = ATTACH_ICON[a.type] ?? File;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px]"
      style={{ background: 'var(--stone-50)', borderColor: 'var(--line)', color: 'var(--stone-600)' }}>
      <Icon size={12} style={{ color: 'var(--indigo-500)', flexShrink: 0 }} />
      <span className="font-medium truncate max-w-[120px]">{a.name}</span>
      <span style={{ color: 'var(--stone-400)' }}>{a.size}</span>
    </span>
  );
}

// ── Thread (답글) Panel ─────────────────────────────────────────────────────

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
    <div className="mt-2 rounded-xl overflow-hidden border-l-2"
      style={{ borderColor: 'var(--stone-300)', background: 'var(--stone-50)' }}>

      {post.comments.length === 0 && (
        <p className="px-4 py-3 text-[11px]" style={{ color: 'var(--stone-400)' }}>첫 답글을 남겨보세요</p>
      )}

      {post.comments.map((c, i) => {
        const ca = profiles[c.authorId] ?? { name: '알 수 없음', avatarInitial: '?', avatarColor: '#999', position: '', role: 'member' };
        return (
          <div key={c.id}
            className={`flex gap-2.5 px-4 py-2.5 ${i < post.comments.length - 1 ? 'border-b' : ''}`}
            style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
            <Avatar initial={ca.avatarInitial} color={ca.avatarColor} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[12px] font-semibold" style={{ color: 'var(--foreground)' }}>{ca.name}</span>
                <span className="text-[10px]" style={{ color: 'var(--indigo-400)' }}>{formatTime(c.createdAt)}</span>
              </div>
              <p className="text-[12px] leading-relaxed" style={{ color: 'var(--stone-700)' }}>{c.content}</p>
            </div>
          </div>
        );
      })}

      {/* Reply input */}
      <div className="px-4 py-2.5 border-t" style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
        <form onSubmit={handleReply} className="flex items-center gap-2">
          <Avatar initial={currentUserProfile.avatarInitial} color={currentUserProfile.avatarColor} size="sm" />
          <input
            type="text"
            value={reply}
            onChange={e => setReply(e.target.value)}
            placeholder="답글 입력..."
            className="flex-1 px-3 py-1.5 rounded-lg border text-[12px] outline-none transition-colors"
            style={{ borderColor: 'rgba(99,102,241,0.2)', background: 'white', color: 'var(--foreground)' }}
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--indigo-400)')}
            onBlur={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)')}
          />
          <button type="submit" disabled={!reply.trim() || sending}
            className="p-1.5 rounded-lg disabled:opacity-30 transition-all flex-shrink-0"
            style={{ color: 'var(--indigo-600)' }}>
            <Send size={13} />
          </button>
        </form>
      </div>
    </div>
  );
}

// ── ChatMessage Card ────────────────────────────────────────────────────────

function ChatMessage({
  post, showDateSep, profiles, currentUserId, currentUserProfile,
}: {
  post: Post;
  showDateSep: boolean;
  profiles: Record<string, ProfileInfo>;
  currentUserId: string;
  currentUserProfile: ProfileInfo;
}) {
  const [threadOpen, setThreadOpen] = useState(false);
  const author = profiles[post.authorId] ?? {
    name: '알 수 없음', position: '', role: 'member', avatarInitial: '?', avatarColor: '#94a3b8',
  };
  const isMyMessage = post.authorId === currentUserId;

  return (
    <>
      {showDateSep && (
        <div className="flex items-center gap-3 py-5">
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border"
            style={{ color: 'var(--stone-500)', borderColor: 'var(--line)', background: 'var(--bg-surface)' }}>
            {formatDateLabel(post.createdAt)}
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        </div>
      )}

      <div className="mb-3">
        {/* Message card */}
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            borderColor: 'var(--line)',
            boxShadow: 'var(--shadow-card)',
            borderLeft: post.isPinned ? '3px solid var(--warning)' : undefined,
          }}
        >
          {/* Card header */}
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
            <Avatar initial={author.avatarInitial} color={author.avatarColor} size="sm" />
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{author.name}</span>
              {author.role === 'admin' && <Badge variant="indigo">관리자</Badge>}
              {isMyMessage && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: 'var(--stone-100)', color: 'var(--stone-500)' }}>나</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {post.isPinned && <Pin size={11} style={{ color: 'var(--indigo-400)' }} />}
              <span className="text-[11px]" style={{ color: 'var(--stone-400)' }}>{formatTime(post.createdAt)}</span>
            </div>
          </div>

          {/* Divider */}
          <div className="mx-4 h-px" style={{ background: 'var(--line)' }} />

          {/* Content */}
          <div className="px-4 pt-2.5 pb-3">
            {post.title && (
              <p className="text-[14px] font-bold mb-1" style={{ color: 'var(--foreground)' }}>{post.title}</p>
            )}
            <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--stone-700)' }}
              dangerouslySetInnerHTML={{ __html: post.content.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }}
            />

            {/* Attachments */}
            {post.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.attachments.map(a => <AttachChip key={a.id} a={a} />)}
              </div>
            )}

            {/* Thread toggle */}
            <button
              onClick={() => setThreadOpen(o => !o)}
              className="flex items-center gap-1 mt-2.5 text-[10px] font-normal transition-colors hover:underline"
              style={{ color: threadOpen ? 'var(--indigo-500)' : 'var(--stone-400)' }}
            >
              <MessageSquare size={12} />
              <span>{post.comments.length > 0 ? `${post.comments.length}개 답글` : '답글 달기'}</span>
              {post.comments.length > 0 && (
                <ChevronDown size={11} className={`transition-transform duration-200 ${threadOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
          </div>
        </div>

        {/* Thread panel — attached below card */}
        {threadOpen && (
          <div className="ml-6">
            <ThreadPanel
              post={post}
              profiles={profiles}
              currentUserId={currentUserId}
              currentUserProfile={currentUserProfile}
            />
          </div>
        )}
      </div>
    </>
  );
}

// ── Pending file chip (composer) ────────────────────────────────────────────

function PendingFileChip({ file, onRemove }: { file: File; onRemove: () => void }) {
  const Icon = ATTACH_ICON[detectType(file)] ?? File;
  return (
    <span className="inline-flex items-center gap-1.5 pl-2.5 pr-1.5 py-1 rounded-lg border text-[11px]"
      style={{ background: 'var(--indigo-50)', borderColor: 'var(--indigo-200)', color: 'var(--indigo-700)' }}>
      <Icon size={12} />
      <span className="font-medium max-w-[100px] truncate">{file.name}</span>
      <span style={{ color: 'var(--indigo-400)' }}>{formatSize(file.size)}</span>
      <button onClick={onRemove} className="ml-0.5 p-0.5 rounded hover:bg-[var(--indigo-100)] transition-colors">
        <XIcon size={11} />
      </button>
    </span>
  );
}

// ── Main ChatFeed ───────────────────────────────────────────────────────────

export default function ChatFeed({ posts, currentUserId, currentUserProfile, profiles }: ChatFeedProps) {
  const router = useRouter();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() && pendingFiles.length === 0) return;
    if (sending) return;
    setSending(true);
    try {
      const supabase = createClient();

      // Insert post
      const { data: postData } = await supabase
        .from('work_posts')
        .insert({ board_id: 'feed', author_id: currentUserId, content: message.trim() || '(첨부파일)' })
        .select('id')
        .single();

      const postId = postData?.id;

      // Upload attachments
      if (postId && pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const storagePath = `${postId}/${Date.now()}-${file.name}`;
          const { error: upErr } = await supabase.storage
            .from('attachments')
            .upload(storagePath, file);

          await supabase.from('work_attachments').insert({
            post_id: postId,
            name: file.name,
            size: formatSize(file.size),
            type: detectType(file),
            storage_path: upErr ? '' : storagePath,
          });
        }
      }

      setMessage('');
      setPendingFiles([]);
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      router.refresh();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } finally {
      setSending(false);
    }
  }

  // Date separator logic
  const withMeta = posts.map((post, i) => {
    const prev = posts[i - 1];
    const diffDay = !prev || new Date(post.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
    return { ...post, showDateSep: diffDay };
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Scrollable message list */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-3 sm:px-6 py-5 pb-3">
          {posts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--indigo-50)' }}>
                <MessageSquare size={24} style={{ color: 'var(--indigo-500)' }} />
              </div>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>아직 메시지가 없습니다</p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--muted)' }}>첫 메시지를 입력해 대화를 시작해보세요</p>
            </div>
          )}

          {withMeta.map(post => (
            <ChatMessage
              key={post.id}
              post={post}
              showDateSep={post.showDateSep}
              profiles={profiles}
              currentUserId={currentUserId}
              currentUserProfile={currentUserProfile}
            />
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input area */}
      <div className="flex-shrink-0 border-t px-3 sm:px-6 py-3"
        style={{ borderColor: 'var(--line)', background: 'var(--bg-surface)' }}>
        <div className="max-w-2xl mx-auto">

          {/* Pending files preview */}
          {pendingFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2 pb-2 border-b" style={{ borderColor: 'var(--line)' }}>
              {pendingFiles.map((f, i) => (
                <PendingFileChip key={i} file={f} onRemove={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))} />
              ))}
            </div>
          )}

          <form onSubmit={handleSend} className="flex items-end gap-2">
            <Avatar initial={currentUserProfile.avatarInitial} color={currentUserProfile.avatarColor} size="sm" />

            <div className="flex-1 rounded-xl border overflow-hidden transition-colors focus-within:border-[var(--indigo-400)]"
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
                className="w-full px-4 py-2.5 text-[13px] outline-none resize-none bg-transparent"
                style={{ color: 'var(--foreground)', minHeight: '40px' }}
              />
              <div className="flex items-center px-3 pb-2 gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ color: 'var(--stone-400)' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--indigo-500)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--stone-400)')}
                  title="파일 첨부"
                >
                  <Paperclip size={14} />
                </button>
                <span className="text-[10px] ml-auto" style={{ color: 'var(--stone-400)' }}>
                  {pendingFiles.length > 0 ? `${pendingFiles.length}개 파일 첨부됨` : 'Shift+Enter 줄바꿈'}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={(!message.trim() && pendingFiles.length === 0) || sending}
              className="p-2.5 rounded-xl flex-shrink-0 disabled:opacity-30 transition-all"
              style={{
                background: (message.trim() || pendingFiles.length > 0) ? 'var(--indigo-600)' : 'var(--stone-200)',
                color: (message.trim() || pendingFiles.length > 0) ? 'white' : 'var(--stone-400)',
              }}
            >
              <Send size={15} />
            </button>
          </form>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
}
