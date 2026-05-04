'use client';
import { useEffect, useRef, useState } from 'react';
import {
  Send, Pin, FileSpreadsheet, FileText, Image as ImageIcon,
  File, MessageSquare, ChevronDown, Paperclip, X as XIcon,
  CalendarDays, ChevronLeft, ChevronRight,
  ChevronsDown, Check, Edit3, Trash2, PanelRightOpen,
} from 'lucide-react';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import AttachmentViewer from './attachment-viewer';
import {
  loadFeedPostById,
  loadFeedPostsAroundPost,
  loadFeedPostsFromDate,
  loadOlderFeedPosts,
} from '@/app/(workspace)/feed/actions';
import { createClient } from '@/lib/supabase/client';
import { renderRichText } from '@/lib/rich-text';
import type { BoardRole, FeedDateCount, Post, Attachment } from '@/lib/types';
import type { WorkStatus } from '@/lib/types';

type ProfileInfo = { name: string; position: string; role: string; avatarInitial: string; avatarColor: string };
type MentionOption = ProfileInfo & { id: string };

interface ChatFeedProps {
  boardId?: string;
  variant?: 'default' | 'notice' | 'business';
  canCreatePost?: boolean;
  initialPosts: Post[];
  initialPinnedPosts: Post[];
  initialHasMoreOlder: boolean;
  dateCounts: FeedDateCount[];
  currentUserId: string;
  currentUserProfile: ProfileInfo;
  currentBoardRole?: BoardRole;
  profiles: Record<string, ProfileInfo>;
}

const WORK_STATUS_LABEL: Record<WorkStatus, string> = {
  in_progress: '진행중',
  completed: '완료',
  on_hold: '보류',
};

const WORK_STATUS_BADGE: Record<WorkStatus, 'indigo' | 'green' | 'yellow'> = {
  in_progress: 'indigo',
  completed: 'green',
  on_hold: 'yellow',
};

const WORK_STATUS_CARD_STYLE: Record<WorkStatus, {
  background: string;
  borderColor: string;
  borderLeftColor: string;
  boxShadow: string;
}> = {
  in_progress: {
    background: '#eef2ff',
    borderColor: 'rgba(99,102,241,0.55)',
    borderLeftColor: 'var(--indigo-600)',
    boxShadow: '0 1px 8px rgba(99,102,241,0.12), inset 0 0 0 1px rgba(99,102,241,0.08)',
  },
  completed: {
    background: '#ecfdf5',
    borderColor: 'rgba(16,185,129,0.62)',
    borderLeftColor: 'var(--success)',
    boxShadow: '0 1px 8px rgba(16,185,129,0.12), inset 0 0 0 1px rgba(16,185,129,0.08)',
  },
  on_hold: {
    background: '#fef9c3',
    borderColor: 'rgba(245,158,11,0.58)',
    borderLeftColor: 'var(--warning)',
    boxShadow: '0 1px 8px rgba(245,158,11,0.12), inset 0 0 0 1px rgba(245,158,11,0.08)',
  },
};

function nextPinnedForStatus(status: WorkStatus) {
  return status === 'in_progress';
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
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
}

function buildCalendarDays(baseDate: Date) {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();
  const first = new Date(year, month, 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return {
      key: date.toLocaleDateString('en-CA'),
      day: date.getDate(),
      inMonth: date.getMonth() === month,
    };
  });
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

function storageSafeFileName(fileName: string) {
  const ext = fileName.includes('.') ? fileName.slice(fileName.lastIndexOf('.')).toLowerCase() : '';
  const base = fileName.includes('.') ? fileName.slice(0, fileName.lastIndexOf('.')) : fileName;
  const safeBase = base
    .normalize('NFKD')
    .replace(/[^\w.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
  return `${safeBase || 'attachment'}${ext}`;
}

function sortPostsAscending(posts: Post[]) {
  return [...posts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

function getPostDateKey(post: Post) {
  return new Date(post.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

function updateDateCount(counts: FeedDateCount[], date: string, delta: 1 | -1) {
  const next = counts
    .map(row => row.date === date ? { ...row, count: row.count + delta } : row)
    .filter(row => row.count > 0);

  if (delta > 0 && !counts.some(row => row.date === date)) {
    next.push({ date, count: delta });
  }

  return next.sort((a, b) => a.date.localeCompare(b.date));
}

function getActiveMentionToken(value: string, cursor: number) {
  const beforeCursor = value.slice(0, cursor);
  const match = beforeCursor.match(/(^|\s)@([^\s@#]*)$/);
  if (!match) return null;

  const query = match[2] ?? '';
  return {
    query,
    start: cursor - query.length - 1,
    end: cursor,
  };
}

// ── Thread (답글) Panel ─────────────────────────────────────────────────────

function ThreadPanel({
  post, profiles, currentUserId, currentUserProfile, onCommentCreated, onCommentUpdated, onCommentDeleted,
}: {
  post: Post;
  profiles: Record<string, ProfileInfo>;
  currentUserId: string;
  currentUserProfile: ProfileInfo;
  onCommentCreated: (postId: string, comment: Post['comments'][number]) => void;
  onCommentUpdated: (postId: string, commentId: string, content: string) => void;
  onCommentDeleted: (postId: string, commentId: string) => void;
}) {
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState('');

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!reply.trim()) return;
    setSending(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('work_comments').insert({
        post_id: post.id,
        author_id: currentUserId,
        content: reply.trim(),
      }).select('id, author_id, content, created_at').single();
      if (!error && data) {
        await supabase.rpc('create_feed_mention_notifications', {
          p_post_id: post.id,
          p_content: reply.trim(),
        });
        onCommentCreated(post.id, {
          id: data.id as string,
          authorId: data.author_id as string,
          content: data.content as string,
          createdAt: data.created_at as string,
        });
        setReply('');
      }
    } finally { setSending(false); }
  }

  async function saveComment(commentId: string) {
    const next = editingComment.trim();
    if (!next) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('work_comments')
      .update({ content: next })
      .eq('id', commentId);

    if (!error) {
      onCommentUpdated(post.id, commentId, next);
      setEditingCommentId(null);
      setEditingComment('');
    }
  }

  async function deleteComment(commentId: string) {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('work_comments')
      .delete()
      .eq('id', commentId);

    if (!error) onCommentDeleted(post.id, commentId);
  }

  return (
    <div className="mt-2 rounded-xl overflow-hidden"
      style={{ border: '1px solid var(--line)', borderLeft: '3px solid var(--stone-300)', background: 'var(--stone-50)' }}>

      {post.comments.length === 0 && (
        <p className="px-4 py-3 text-[10px]" style={{ color: 'var(--stone-400)' }}>첫 답글을 남겨보세요</p>
      )}

      {post.comments.map((c, i) => {
        const ca = profiles[c.authorId] ?? { name: '알 수 없음', avatarInitial: '?', avatarColor: '#999', position: '', role: 'member' };
        const isMine = c.authorId === currentUserId;
        const isEditing = editingCommentId === c.id;
        return (
          <div key={c.id}
            className={`flex gap-2.5 px-4 py-2.5 ${i < post.comments.length - 1 ? 'border-b' : ''}`}
            style={{ borderColor: 'rgba(99,102,241,0.1)' }}>
            <Avatar initial={ca.avatarInitial} color={ca.avatarColor} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold" style={{ color: 'var(--foreground)' }}>{ca.name}</span>
                <span className="text-[10px]" style={{ color: 'var(--indigo-400)' }}>{formatTime(c.createdAt)}</span>
                {isMine && (
                  <span className="ml-auto flex items-center gap-1">
                    {isEditing ? (
                      <>
                        <button type="button" onClick={() => void saveComment(c.id)} className="p-1 rounded hover:bg-white" aria-label="댓글 저장">
                          <Check size={11} />
                        </button>
                        <button type="button" onClick={() => { setEditingCommentId(null); setEditingComment(''); }} className="p-1 rounded hover:bg-white" aria-label="댓글 수정 취소">
                          <XIcon size={11} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => { setEditingCommentId(c.id); setEditingComment(c.content); }} className="p-1 rounded hover:bg-white" aria-label="댓글 수정">
                          <Edit3 size={11} />
                        </button>
                        <button type="button" onClick={() => void deleteComment(c.id)} className="p-1 rounded hover:bg-white text-[var(--danger)]" aria-label="댓글 삭제">
                          <Trash2 size={11} />
                        </button>
                      </>
                    )}
                  </span>
                )}
              </div>
              {isEditing ? (
                <input
                  value={editingComment}
                  onChange={e => setEditingComment(e.target.value)}
                  className="w-full px-2 py-1 rounded border text-[11px] outline-none"
                  style={{ borderColor: 'var(--line)', background: 'white', color: 'var(--foreground)' }}
                />
              ) : (
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--stone-700)' }}>{c.content}</p>
              )}
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
            className="flex-1 px-3 py-1.5 rounded-lg border text-[10px] outline-none transition-colors"
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
  post,
  showDateSep,
  profiles,
  currentUserId,
  currentUserProfile,
  onPostUpdated,
  onPostDeleted,
  onPostPinned,
  onCommentCreated,
  onCommentUpdated,
  onCommentDeleted,
  variant = 'default',
}: {
  post: Post;
  showDateSep: boolean;
  profiles: Record<string, ProfileInfo>;
  currentUserId: string;
  currentUserProfile: ProfileInfo;
  variant?: 'default' | 'notice' | 'business';
  onPostUpdated: (postId: string, content: string) => void;
  onPostDeleted: (postId: string) => void;
  onPostPinned: (post: Post, isPinned: boolean) => void;
  onCommentCreated: (postId: string, comment: Post['comments'][number]) => void;
  onCommentUpdated: (postId: string, commentId: string, content: string) => void;
  onCommentDeleted: (postId: string, commentId: string) => void;
}) {
  const [threadOpen, setThreadOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editingContent, setEditingContent] = useState(post.content);
  const containerRef = useRef<HTMLDivElement>(null);
  const threadPanelRef = useRef<HTMLDivElement>(null);
  const author = profiles[post.authorId] ?? {
    name: '알 수 없음', position: '', role: 'member', avatarInitial: '?', avatarColor: '#94a3b8',
  };
  const isMyMessage = post.authorId === currentUserId;
  const canManagePost = isMyMessage || currentUserProfile.role === 'admin';
  const canManageWorkStatus = canManagePost || post.assigneeId === currentUserId;
  const isNotice = variant === 'notice';
  const isBusiness = variant === 'business';
  const isTaskPost = isBusiness && Boolean(post.workStatus);
  const taskCardStyle = isTaskPost ? WORK_STATUS_CARD_STYLE[post.workStatus!] : null;
  const assignee = post.assigneeId ? profiles[post.assigneeId] : null;

  useEffect(() => {
    if (!threadOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setThreadOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [threadOpen]);

  useEffect(() => {
    if (!threadOpen) return;
    requestAnimationFrame(() => {
      threadPanelRef.current?.scrollIntoView({ block: 'end', behavior: 'smooth' });
    });
  }, [threadOpen]);

  async function savePost() {
    const next = editingContent.trim();
    if (!next) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('work_posts')
      .update({ content: next })
      .eq('id', post.id);

    if (!error) {
      await supabase.rpc('create_feed_mention_notifications', {
        p_post_id: post.id,
        p_content: next,
      });
      onPostUpdated(post.id, next);
      setEditingPost(false);
    }
  }

  async function deletePost() {
    if (!window.confirm('글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다.')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('work_posts')
      .delete()
      .eq('id', post.id);

    if (!error) onPostDeleted(post.id);
  }

  async function togglePin() {
    const nextPinned = !post.isPinned;
    const supabase = createClient();
    const { error } = await supabase
      .from('work_posts')
      .update({ is_pinned: nextPinned })
      .eq('id', post.id);

    if (!error) onPostPinned(post, nextPinned);
  }

  async function updateWorkStatus(status: WorkStatus) {
    const nextPinned = nextPinnedForStatus(status);
    const supabase = createClient();
    const { error } = await supabase
      .from('work_posts')
      .update({ work_status: status, is_pinned: nextPinned })
      .eq('id', post.id);

    if (!error) onPostPinned({ ...post, workStatus: status }, nextPinned);
  }

  return (
    <>
      {showDateSep && (
        <div className="flex items-center gap-3 py-5" data-feed-date={getPostDateKey(post)}>
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
          <span className="text-[11px] font-semibold px-3 py-1 rounded-full border"
            style={{ color: 'var(--stone-500)', borderColor: 'var(--line)', background: 'var(--bg-surface)' }}>
            {formatDateLabel(post.createdAt)}
          </span>
          <div className="flex-1 h-px" style={{ background: 'var(--line)' }} />
        </div>
      )}

      <div ref={containerRef} className="mb-3">
        {/* Message card */}
        <div
          data-feed-post-id={post.id}
          className="rounded-xl border overflow-hidden"
          style={{
            background: taskCardStyle?.background ?? (post.isPinned || isNotice ? '#fffbeb' : 'var(--bg-surface)'),
            borderColor: taskCardStyle?.borderColor ?? (post.isPinned || isNotice ? 'rgba(245,158,11,0.75)' : 'var(--line)'),
            borderLeftWidth: isTaskPost || post.isPinned || isNotice ? 4 : 1,
            borderLeftColor: taskCardStyle?.borderLeftColor ?? (post.isPinned || isNotice ? 'var(--warning)' : 'var(--line)'),
            boxShadow: taskCardStyle?.boxShadow ?? (post.isPinned
              ? '0 2px 10px rgba(245,158,11,0.14), inset 0 0 0 1px rgba(245,158,11,0.08)'
              : isNotice
                ? '0 1px 8px rgba(245,158,11,0.1), inset 0 0 0 1px rgba(245,158,11,0.06)'
              : '0 1px 2px rgba(15,23,42,0.05)'),
          }}
        >
          {/* Card header */}
          <div className="flex items-center gap-2.5 px-4 pt-3 pb-2">
            <Avatar initial={author.avatarInitial} color={author.avatarColor} size="sm" />
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <span className="text-[13px] font-semibold" style={{ color: 'var(--foreground)' }}>{author.name}</span>
              {author.role === 'admin' && <Badge variant="indigo">관리자</Badge>}
              {isBusiness && post.workStatus && (
                <Badge variant={WORK_STATUS_BADGE[post.workStatus]}>{WORK_STATUS_LABEL[post.workStatus]}</Badge>
              )}
              {isBusiness && assignee && (
                <span className="text-[11px] font-semibold text-[var(--stone-500)]">@{assignee.name}</span>
              )}
              {isMyMessage && (
                <span className="text-[10px] px-1.5 py-0.5 rounded font-medium"
                  style={{ background: 'var(--stone-100)', color: 'var(--stone-500)' }}>나</span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isBusiness && isTaskPost && canManageWorkStatus && (
                <select
                  value={post.workStatus ?? 'in_progress'}
                  onChange={e => void updateWorkStatus(e.target.value as WorkStatus)}
                  className="rounded-md border px-1.5 py-1 text-[11px] outline-none"
                  style={{ borderColor: 'var(--line)', background: 'white', color: 'var(--foreground)' }}
                  aria-label="진행상태"
                >
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="on_hold">보류</option>
                </select>
              )}
              {canManagePost && (
                <>
                  {editingPost ? (
                    <>
                      <button type="button" onClick={() => void savePost()} className="p-1 rounded hover:bg-[var(--stone-100)]" aria-label="글 저장">
                        <Check size={12} />
                      </button>
                      <button type="button" onClick={() => { setEditingPost(false); setEditingContent(post.content); }} className="p-1 rounded hover:bg-[var(--stone-100)]" aria-label="글 수정 취소">
                        <XIcon size={12} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button type="button" onClick={() => setEditingPost(true)} className="p-1 rounded hover:bg-[var(--stone-100)]" aria-label="글 수정">
                        <Edit3 size={12} />
                      </button>
                      <button type="button" onClick={() => void deletePost()} className="p-1 rounded hover:bg-[var(--stone-100)] text-[var(--danger)]" aria-label="글 삭제">
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </>
              )}
              {canManagePost ? (
                !isBusiness && (
                  <button
                  type="button"
                  onClick={() => void togglePin()}
                  className="p-1 rounded hover:bg-[var(--stone-100)]"
                  aria-label={post.isPinned ? '핀 고정 해제' : '핀 고정'}
                  title={post.isPinned ? '핀 고정 해제' : '핀 고정'}
                  style={{ color: post.isPinned ? 'var(--warning)' : 'var(--stone-400)' }}
                  >
                    <Pin size={12} fill={post.isPinned ? 'currentColor' : 'none'} />
                  </button>
                )
              ) : (
                post.isPinned && !isBusiness && <Pin size={11} style={{ color: 'var(--warning)' }} />
              )}
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
            {editingPost ? (
              <textarea
                value={editingContent}
                onChange={e => setEditingContent(e.target.value)}
                rows={4}
                className="w-full resize-none rounded-lg border px-3 py-2 text-[13px] outline-none"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)', color: 'var(--foreground)' }}
              />
            ) : (
              <p className="text-[13px] leading-relaxed whitespace-pre-line" style={{ color: 'var(--stone-700)' }}>
                {renderRichText(post.content)}
              </p>
            )}

            {/* Attachments */}
            {post.attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {post.attachments.map(a => <AttachmentViewer key={a.id} attachment={a} />)}
              </div>
            )}

            {/* Thread toggle */}
            <button
              onClick={() => setThreadOpen(o => !o)}
              className="flex items-center gap-1 mt-2.5 text-[11px] font-normal transition-colors hover:underline"
              style={{ color: threadOpen ? 'var(--indigo-500)' : 'var(--stone-400)' }}
            >
              <MessageSquare size={10} />
              <span>{post.comments.length > 0 ? `${post.comments.length}개 답글` : '답글 달기'}</span>
              {post.comments.length > 0 && (
                <ChevronDown size={11} className={`transition-transform duration-200 ${threadOpen ? 'rotate-180' : ''}`} />
              )}
            </button>
          </div>
        </div>

        {/* Thread panel — attached below card */}
        {threadOpen && (
          <div ref={threadPanelRef} className="ml-6 scroll-mb-4">
            <ThreadPanel
              post={post}
              profiles={profiles}
              currentUserId={currentUserId}
              currentUserProfile={currentUserProfile}
              onCommentCreated={onCommentCreated}
              onCommentUpdated={onCommentUpdated}
              onCommentDeleted={onCommentDeleted}
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

function FeedCalendarPanel({
  pinnedPosts,
  profiles,
  dateCounts,
  activeDate,
  onSelectPinnedPost,
  onSelectDate,
  onJumpLatest,
  variant = 'default',
  className = 'hidden xl:flex w-[280px] flex-shrink-0 border-l bg-white flex-col',
}: {
  pinnedPosts: Post[];
  profiles: Record<string, ProfileInfo>;
  dateCounts: FeedDateCount[];
  activeDate: string | null;
  onSelectPinnedPost: (post: Post) => void;
  onSelectDate: (date: string) => void;
  onJumpLatest: () => void;
  variant?: 'default' | 'notice' | 'business';
  className?: string;
}) {
  const isBusiness = variant === 'business';
  const [taskStatusTab, setTaskStatusTab] = useState<WorkStatus>('in_progress');
  const taskListPosts = isBusiness
    ? pinnedPosts.filter(post => post.workStatus === taskStatusTab)
    : pinnedPosts;
  const newest = dateCounts[dateCounts.length - 1];
  const [panelMonth, setPanelMonth] = useState(() => (
    newest ? new Date(`${newest.date}T00:00:00`) : new Date()
  ));
  const days = buildCalendarDays(panelMonth);
  const counts = dateCounts.reduce<Record<string, number>>((acc, row) => {
    acc[row.date] = row.count;
    return acc;
  }, {});

  return (
    <aside className={className} style={{ borderColor: 'var(--line)' }}>
      <div
        className="border-b"
        style={{ borderColor: 'rgba(245,158,11,0.32)', background: '#fffbeb' }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(245,158,11,0.28)', background: '#fef3c7' }}>
          <div className="flex items-center gap-2">
            {!isBusiness && <Pin size={15} className="text-[var(--warning)]" fill="currentColor" />}
            <h2 className="text-[13px] font-bold text-[var(--foreground)]">{isBusiness ? '업무리스트' : '고정 글'}</h2>
          </div>
          {isBusiness && (
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-lg border bg-white p-1" style={{ borderColor: 'rgba(245,158,11,0.32)' }}>
              {([
                ['in_progress', '진행중'],
                ['completed', '완료'],
                ['on_hold', '보류'],
              ] as Array<[WorkStatus, string]>).map(([status, label]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setTaskStatusTab(status)}
                  className="rounded-md px-2 py-1.5 text-[11px] font-semibold transition-colors"
                  style={{
                    background: taskStatusTab === status ? 'var(--indigo-600)' : 'transparent',
                    color: taskStatusTab === status ? 'white' : 'var(--stone-600)',
                  }}
                  aria-pressed={taskStatusTab === status}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
        <div
          className="max-h-[260px] overflow-y-auto p-3 space-y-2"
          style={{ scrollbarColor: 'rgba(245,158,11,0.65) #fef3c7' }}
        >
          {taskListPosts.length === 0 ? (
            <p className="px-1 py-4 text-center text-[11px] text-[var(--stone-400)]">
              {isBusiness ? `${WORK_STATUS_LABEL[taskStatusTab]} 업무가 없습니다.` : '고정된 글이 없습니다.'}
            </p>
          ) : (
            taskListPosts.map(post => {
              const author = profiles[post.authorId];
              const taskCardStyle = post.workStatus ? WORK_STATUS_CARD_STYLE[post.workStatus] : null;
              return (
                <button
                  key={post.id}
                  type="button"
                  onClick={() => onSelectPinnedPost(post)}
                  className="w-full rounded-lg border px-3 py-2 text-left transition-opacity hover:opacity-90"
                  style={{
                    borderColor: taskCardStyle?.borderColor ?? 'rgba(245,158,11,0.35)',
                    borderLeftWidth: taskCardStyle ? 4 : 1,
                    borderLeftColor: taskCardStyle?.borderLeftColor ?? 'rgba(245,158,11,0.35)',
                    background: taskCardStyle?.background ?? 'white',
                    boxShadow: taskCardStyle?.boxShadow,
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-[11px] font-semibold text-[var(--stone-700)] truncate">{author?.name ?? '사용자'}</span>
                    <span className="ml-auto text-[10px] text-[var(--stone-400)]">{formatTime(post.createdAt)}</span>
                  </div>
                  <p className="text-[11px] leading-snug text-[var(--stone-600)] line-clamp-2">
                    {post.content}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--line)' }}>
        <div className="flex items-center gap-2">
          <CalendarDays size={15} className="text-[var(--stone-500)]" />
          <h2 className="text-[13px] font-bold text-[var(--foreground)]">피드 캘린더</h2>
        </div>
      </div>

      <div className="flex-1 p-3">
        <div className="flex items-center justify-between px-1 mb-3">
          <button
            type="button"
            onClick={() => setPanelMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
            className="p-1.5 rounded-md text-[var(--stone-500)] hover:bg-[var(--stone-100)]"
            aria-label="이전 달"
          >
            <ChevronLeft size={14} />
          </button>
          <div className="text-[12px] font-semibold text-[var(--stone-700)]">
            {panelMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPanelMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
              className="p-1.5 rounded-md text-[var(--stone-500)] hover:bg-[var(--stone-100)]"
              aria-label="다음 달"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="h-6 flex items-center justify-center text-[10px] font-semibold text-[var(--stone-400)]">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const count = counts[day.key] ?? 0;
            const isHighlighted = activeDate === day.key;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => onSelectDate(day.key)}
                className="h-11 rounded-lg border text-[11px] tabular transition-colors flex flex-col items-center justify-center gap-0.5"
                style={{
                  borderColor: isHighlighted ? 'var(--stone-500)' : 'transparent',
                  background: isHighlighted ? 'var(--stone-100)' : count > 0 ? 'var(--stone-50)' : 'transparent',
                  color: day.inMonth ? 'var(--stone-700)' : 'var(--stone-300)',
                  boxShadow: isHighlighted ? 'inset 0 0 0 1px var(--stone-500)' : undefined,
                }}
                aria-label={`${day.key}부터 보기, 글 ${count}개`}
              >
                <span className="leading-none">{day.day}</span>
                {count > 0 && (
                  <span
                    className="min-w-4 h-4 px-1 rounded-full text-[9px] font-bold flex items-center justify-center leading-none"
                    style={{ background: 'var(--indigo-600)', color: 'white' }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 border-t" style={{ borderColor: 'var(--line)' }}>
        <button
          type="button"
          onClick={onJumpLatest}
          className="w-full flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold text-[var(--stone-700)] hover:bg-[var(--stone-100)]"
          style={{ borderColor: 'var(--line)' }}
        >
          <ChevronsDown size={14} />
          최신 글로 이동
        </button>
      </div>
    </aside>
  );
}

export default function ChatFeed({
  boardId = 'feed',
  variant = 'default',
  canCreatePost = true,
  initialPosts,
  initialPinnedPosts,
  initialHasMoreOlder,
  dateCounts,
  currentUserId,
  currentUserProfile,
  currentBoardRole = 'member',
  profiles,
}: ChatFeedProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initialDateCountsRef = useRef(dateCounts);
  const [posts, setPosts] = useState<Post[]>(() => sortPostsAscending(initialPosts));
  const [pinnedPosts, setPinnedPosts] = useState<Post[]>(() => sortPostsAscending(initialPinnedPosts).reverse());
  const [calendarDateCounts, setCalendarDateCounts] = useState<FeedDateCount[]>(dateCounts);
  const [hasMoreOlder, setHasMoreOlder] = useState(initialHasMoreOlder);
  const [hasMoreAfterDate, setHasMoreAfterDate] = useState(false);
  const [message, setMessage] = useState('');
  const [taskMode, setTaskMode] = useState(false);
  const [taskAssigneeId, setTaskAssigneeId] = useState('');
  const [mentionToken, setMentionToken] = useState<{ query: string; start: number; end: number } | null>(null);
  const [mentionIndex, setMentionIndex] = useState(0);
  const [sending, setSending] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [anchorDate, setAnchorDate] = useState<string | null>(null);
  const [mobilePanelOpen, setMobilePanelOpen] = useState(false);
  const pendingScrollPostRef = useRef<{ postId: string; behavior: ScrollBehavior } | null>(null);
  const [activeDate, setActiveDate] = useState<string | null>(() => {
    const sorted = sortPostsAscending(initialPosts);
    return sorted.length > 0 ? getPostDateKey(sorted[sorted.length - 1]) : null;
  });
  const mentionOptions = Object.entries(profiles)
    .filter(([id]) => id !== currentUserId)
    .map(([id, profile]) => ({ ...profile, id }))
    .filter(profile => (
      !mentionToken?.query ||
      profile.name.toLowerCase().includes(mentionToken.query.toLowerCase()) ||
      profile.position.toLowerCase().includes(mentionToken.query.toLowerCase())
    ))
    .slice(0, 8);
  const showMentionOptions = Boolean(mentionToken && mentionOptions.length > 0);
  const assigneeOptions = Object.entries(profiles).map(([id, profile]) => ({ ...profile, id }));
  const isNotice = variant === 'notice';
  const isBusiness = variant === 'business';
  const canViewAllBusinessTasks = currentUserProfile.role === 'admin' || currentBoardRole === 'leader';
  const visiblePinnedPosts = isBusiness && !canViewAllBusinessTasks
    ? pinnedPosts.filter(post => post.assigneeId === currentUserId)
    : pinnedPosts;

  function scrollToPost(postId: string, behavior: ScrollBehavior = 'smooth') {
    const target = scrollRef.current?.querySelector<HTMLElement>(`[data-feed-post-id="${postId}"]`);
    if (!target) return false;

    target.scrollIntoView({ behavior, block: 'center' });
    requestAnimationFrame(() => {
      target.scrollIntoView({ behavior, block: 'center' });
      target.animate(
        [
          { boxShadow: '0 0 0 0 rgba(245,158,11,0)' },
          { boxShadow: '0 0 0 4px rgba(245,158,11,0.28)' },
          { boxShadow: '0 0 0 0 rgba(245,158,11,0)' },
        ],
        { duration: 900, easing: 'ease-out' }
      );
    });
    return true;
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' });
  }, []);

  useEffect(() => {
    const linkedPostId = new URLSearchParams(window.location.search).get('post');
    if (!linkedPostId) return;
    const postId = linkedPostId;

    async function showLinkedPost() {
      const linkedPost = await loadFeedPostById(postId, boardId);
      if (!linkedPost) return;

      const date = getPostDateKey(linkedPost);
      const page = await loadFeedPostsFromDate(date, undefined, boardId);
      const pagePosts = page.posts.some(post => post.id === linkedPost.id)
        ? page.posts
        : [...page.posts, linkedPost];

      setAnchorDate(date);
      setActiveDate(date);
      setPosts(sortPostsAscending(pagePosts));
      setHasMoreAfterDate(page.hasMore);
      setHasMoreOlder(initialDateCountsRef.current.some(row => row.date < date));
      pendingScrollPostRef.current = { postId, behavior: 'instant' };
      window.history.replaceState(null, '', window.location.pathname);
    }

    void showLinkedPost();
  }, []);

  useEffect(() => {
    if (!pendingScrollPostRef.current) return;
    const { postId, behavior } = pendingScrollPostRef.current;
    if (scrollToPost(postId, behavior)) {
      pendingScrollPostRef.current = null;
    }
  }, [posts]);

  async function loadOlder() {
    if (loadingMore || !hasMoreOlder || posts.length === 0) return;

    const container = scrollRef.current;
    const beforeHeight = container?.scrollHeight ?? 0;
    setLoadingMore(true);
    try {
      const page = await loadOlderFeedPosts(posts[0].createdAt, boardId);
      const older = sortPostsAscending(page.posts);
      setPosts(prev => {
        const existing = new Set(prev.map(post => post.id));
        return [...older.filter(post => !existing.has(post.id)), ...prev];
      });
      setHasMoreOlder(page.hasMore);
      requestAnimationFrame(() => {
        if (!container) return;
        container.scrollTop += container.scrollHeight - beforeHeight;
      });
    } finally {
      setLoadingMore(false);
    }
  }

  async function loadNextFromSelectedDate() {
    if (!anchorDate || loadingMore || !hasMoreAfterDate || posts.length === 0) return;

    setLoadingMore(true);
    try {
      const page = await loadFeedPostsFromDate(anchorDate, posts[posts.length - 1].createdAt, boardId);
      setPosts(prev => {
        const existing = new Set(prev.map(post => post.id));
        return sortPostsAscending([...prev, ...page.posts.filter(post => !existing.has(post.id))]);
      });
      setHasMoreAfterDate(page.hasMore);
    } finally {
      setLoadingMore(false);
    }
  }

  function updateActiveDateFromScroll(container: HTMLDivElement) {
    const markers = Array.from(container.querySelectorAll<HTMLElement>('[data-feed-date]'));
    if (markers.length === 0) return;

    const containerTop = container.getBoundingClientRect().top;
    const anchor = containerTop + 88;
    let nextDate = markers[0].dataset.feedDate ?? null;

    for (const marker of markers) {
      if (marker.getBoundingClientRect().top <= anchor) {
        nextDate = marker.dataset.feedDate ?? nextDate;
      } else {
        break;
      }
    }

    if (nextDate && nextDate !== activeDate) {
      setActiveDate(nextDate);
    }
  }

  function handleScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    updateActiveDateFromScroll(el);

    if (anchorDate) {
      if (el.scrollTop < 120) {
        void loadOlder();
      }
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 160) {
        void loadNextFromSelectedDate();
      }
      return;
    }

    if (el.scrollTop < 120) {
      void loadOlder();
    }
  }

  async function handleSelectDate(date: string) {
    setAnchorDate(date);
    setActiveDate(date);
    setLoadingMore(true);
    setError('');
    try {
      const page = await loadFeedPostsFromDate(date, undefined, boardId);
      setPosts(sortPostsAscending(page.posts));
      setHasMoreAfterDate(page.hasMore);
      setHasMoreOlder(calendarDateCounts.some(row => row.date < date));
      requestAnimationFrame(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = 0;
      });
    } catch {
      setError('선택한 날짜의 글을 불러오지 못했습니다.');
    } finally {
      setLoadingMore(false);
    }
  }

  function handleClearDate() {
    setAnchorDate(null);
    setPosts(sortPostsAscending(initialPosts));
    setHasMoreOlder(initialHasMoreOlder);
    setHasMoreAfterDate(false);
    const sorted = sortPostsAscending(initialPosts);
    setActiveDate(sorted.length > 0 ? getPostDateKey(sorted[sorted.length - 1]) : null);
    requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: 'instant' }));
  }

  function handleJumpLatest() {
    handleClearDate();
  }

  async function handleSelectPinnedPost(post: Post) {
    const page = await loadFeedPostsAroundPost(post.id, boardId);
    const linkedPost = page.posts.find(item => item.id === post.id) ?? await loadFeedPostById(post.id, boardId);
    if (!linkedPost) return;

    const date = getPostDateKey(linkedPost);
    const pagePosts = page.posts.some(item => item.id === linkedPost.id)
      ? page.posts
      : [...page.posts, linkedPost];
    pendingScrollPostRef.current = { postId: linkedPost.id, behavior: 'instant' };
    setAnchorDate(date);
    setActiveDate(date);
    setPosts(sortPostsAscending(pagePosts));
    setHasMoreAfterDate(page.hasMore);
    setHasMoreOlder(calendarDateCounts.some(row => row.date < date));
  }

  function handlePostUpdated(postId: string, content: string) {
    setPosts(prev => prev.map(post => post.id === postId ? { ...post, content } : post));
    setPinnedPosts(prev => prev.map(post => post.id === postId ? { ...post, content } : post));
  }

  function handlePostDeleted(postId: string) {
    const deletedPost = posts.find(post => post.id === postId);
    if (deletedPost) {
      setCalendarDateCounts(counts => updateDateCount(counts, getPostDateKey(deletedPost), -1));
    }
    setPosts(prev => prev.filter(post => post.id !== postId));
    setPinnedPosts(prev => prev.filter(post => post.id !== postId));
  }

  function handlePostPinned(post: Post, isPinned: boolean) {
    const nextPost = { ...post, isPinned };
    setPosts(prev => prev.map(item => item.id === post.id ? nextPost : item));
    setPinnedPosts(prev => {
      if (isBusiness && nextPost.workStatus) {
        const existing = prev.filter(item => item.id !== post.id);
        return [nextPost, ...existing].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
      if (!isPinned) return prev.filter(item => item.id !== post.id);
      const existing = prev.filter(item => item.id !== post.id);
      return [nextPost, ...existing].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }

  function handleCommentCreated(postId: string, comment: Post['comments'][number]) {
    setPosts(prev => prev.map(post => (
      post.id === postId ? { ...post, comments: [...post.comments, comment] } : post
    )));
  }

  function handleCommentUpdated(postId: string, commentId: string, content: string) {
    setPosts(prev => prev.map(post => (
      post.id === postId
        ? {
            ...post,
            comments: post.comments.map(comment => (
              comment.id === commentId ? { ...comment, content } : comment
            )),
          }
        : post
    )));
  }

  function handleCommentDeleted(postId: string, commentId: string) {
    setPosts(prev => prev.map(post => (
      post.id === postId
        ? { ...post, comments: post.comments.filter(comment => comment.id !== commentId) }
        : post
    )));
  }

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 160) + 'px';
  }

  function updateMentionToken(value: string, cursor: number | null) {
    const token = getActiveMentionToken(value, cursor ?? value.length);
    setMentionToken(token);
    setMentionIndex(0);
  }

  function insertMention(profile: MentionOption) {
    const token = mentionToken;
    if (!token) return;

    const replacement = `@${profile.name} `;
    const next = `${message.slice(0, token.start)}${replacement}${message.slice(token.end)}`;
    const nextCursor = token.start + replacement.length;

    setMessage(next);
    setMentionToken(null);
    setMentionIndex(0);
    requestAnimationFrame(() => {
      const textarea = textareaRef.current;
      if (!textarea) return;
      textarea.focus();
      textarea.setSelectionRange(nextCursor, nextCursor);
      autoResize();
    });
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPendingFiles(prev => [...prev, ...files]);
    e.target.value = '';
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!canCreatePost) return;
    if (!message.trim() && pendingFiles.length === 0) return;
    if (sending) return;
    if (isBusiness && taskMode && !taskAssigneeId) {
      setError('업무 담당자를 선택하세요.');
      return;
    }
    setSending(true);
    setError('');
    let createdPostId: string | null = null;
    const uploadedPaths: string[] = [];
    const supabase = createClient();
    try {
      // Insert post
      const { data: postData, error: postError } = await supabase
        .from('work_posts')
        .insert({
          board_id: boardId,
          author_id: currentUserId,
          content: message.trim() || '(첨부파일)',
          work_status: isBusiness && taskMode ? 'in_progress' : null,
          assignee_id: isBusiness && taskMode && taskAssigneeId ? taskAssigneeId : null,
          is_pinned: isBusiness && taskMode,
        })
        .select('id, created_at')
        .single();

      const postId = postData?.id;
      if (postError || !postId) throw postError ?? new Error('게시글 저장에 실패했습니다.');
      createdPostId = postId;
      await supabase.rpc('create_feed_mention_notifications', {
        p_post_id: postId,
        p_content: message.trim(),
      });

      // Upload attachments
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          const storagePath = `${postId}/${crypto.randomUUID()}-${storageSafeFileName(file.name)}`;
          const { error: upErr } = await supabase.storage
            .from('attachments')
            .upload(storagePath, file, {
              contentType: file.type || undefined,
            });

          if (upErr) throw upErr;
          uploadedPaths.push(storagePath);

          const { error: attachmentError } = await supabase.from('work_attachments').insert({
            post_id: postId,
            name: file.name,
            size: formatSize(file.size),
            type: detectType(file),
            storage_path: storagePath,
          });

          if (attachmentError) throw attachmentError;
        }
      }

      setMessage('');
      setPendingFiles([]);
      setTaskMode(false);
      setTaskAssigneeId('');
      if (postData.created_at) {
        setCalendarDateCounts(counts => updateDateCount(
          counts,
          new Date(postData.created_at as string).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }),
          1
        ));
      }
      const createdPost = await loadFeedPostById(postId, boardId);
      if (createdPost) {
        setAnchorDate(null);
        setActiveDate(getPostDateKey(createdPost));
        setPosts(prev => {
          const withoutDuplicate = prev.filter(post => post.id !== createdPost.id);
          return sortPostsAscending([...withoutDuplicate, createdPost]);
        });
        if (isBusiness && createdPost.workStatus) {
          setPinnedPosts(prev => {
            const withoutDuplicate = prev.filter(post => post.id !== createdPost.id);
            return [createdPost, ...withoutDuplicate].sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        }
        pendingScrollPostRef.current = { postId, behavior: 'instant' };
      }
      if (textareaRef.current) textareaRef.current.style.height = 'auto';
      window.history.replaceState(null, '', window.location.pathname);
    } catch (err) {
      if (uploadedPaths.length > 0) {
        await supabase.storage.from('attachments').remove(uploadedPaths);
      }
      if (createdPostId) {
        await supabase.from('work_posts').delete().eq('id', createdPostId);
      }
      const message = err instanceof Error ? err.message : '알 수 없는 오류';
      setError(`메시지 저장 중 오류가 발생했습니다. ${message}`);
    } finally {
      setSending(false);
    }
  }

  const visiblePosts = posts;

  const withMeta = visiblePosts.map((post, i) => {
    const prev = visiblePosts[i - 1];
    const diffDay = !prev || new Date(post.createdAt).toDateString() !== new Date(prev.createdAt).toDateString();
    return { ...post, showDateSep: diffDay };
  });

  return (
    <div
      className="relative flex h-full overflow-hidden"
      style={isNotice ? { background: 'linear-gradient(180deg, #fff7ed 0%, var(--bg-canvas) 260px)' } : undefined}
    >
      <button
        type="button"
        onClick={() => setMobilePanelOpen(true)}
        className="fixed bottom-24 right-4 z-50 rounded-full p-3 shadow-lg xl:hidden"
        style={{ background: 'var(--bg-surface)', border: '1px solid var(--line)', color: 'var(--stone-600)' }}
        aria-label={isBusiness ? '업무리스트 열기' : '고정글 열기'}
        title={isBusiness ? '업무리스트' : '고정글'}
      >
        <PanelRightOpen size={18} />
      </button>

      {mobilePanelOpen && (
        <div className="fixed inset-0 z-[70] xl:hidden" role="dialog" aria-modal="true" aria-label={isBusiness ? '업무리스트' : '고정글'}>
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobilePanelOpen(false)}
            aria-label="패널 닫기"
          />
          <div className="absolute right-0 top-0 h-full w-[min(340px,92vw)] bg-white shadow-xl">
            <div className="flex h-12 items-center justify-between border-b px-4" style={{ borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-2">
                {!isBusiness && <Pin size={15} className="text-[var(--warning)]" fill="currentColor" />}
                {isBusiness && <PanelRightOpen size={16} className="text-[var(--indigo-600)]" />}
                <span className="text-[13px] font-bold text-[var(--foreground)]">{isBusiness ? '업무리스트' : '고정 글'}</span>
              </div>
              <button
                type="button"
                onClick={() => setMobilePanelOpen(false)}
                className="rounded-lg p-2 text-[var(--stone-500)] hover:bg-[var(--stone-100)]"
                aria-label="닫기"
              >
                <XIcon size={16} />
              </button>
            </div>
            <FeedCalendarPanel
              pinnedPosts={visiblePinnedPosts}
              profiles={profiles}
              dateCounts={calendarDateCounts}
              activeDate={activeDate}
              onSelectPinnedPost={post => {
                setMobilePanelOpen(false);
                void handleSelectPinnedPost(post);
              }}
              onSelectDate={date => {
                setMobilePanelOpen(false);
                void handleSelectDate(date);
              }}
              onJumpLatest={() => {
                setMobilePanelOpen(false);
                handleJumpLatest();
              }}
              variant={variant}
              className="flex h-[calc(100%-3rem)] w-full flex-col overflow-y-auto bg-white"
            />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 h-full overflow-hidden">
        {/* Scrollable message list */}
        <div ref={scrollRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
          <div className="max-w-2xl mx-auto px-3 sm:px-6 py-5 pb-3">
            {!anchorDate && hasMoreOlder && (
              <div className="py-2 text-center text-[11px] text-[var(--muted)]">
                {loadingMore ? '이전 글을 불러오는 중' : '위로 스크롤하면 이전 글을 불러옵니다'}
              </div>
            )}
            {visiblePosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'var(--indigo-50)' }}>
                <MessageSquare size={24} style={{ color: 'var(--indigo-500)' }} />
              </div>
              <p className="text-[15px] font-semibold" style={{ color: 'var(--foreground)' }}>
                {anchorDate ? '해당 날짜 이후의 메시지가 없습니다' : '아직 메시지가 없습니다'}
              </p>
              <p className="text-[12px] mt-1" style={{ color: 'var(--muted)' }}>
                {anchorDate ? '오른쪽 캘린더에서 다른 날짜를 선택하세요' : '첫 메시지를 입력해 대화를 시작해보세요'}
              </p>
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
                onPostUpdated={handlePostUpdated}
                onPostDeleted={handlePostDeleted}
                onPostPinned={handlePostPinned}
                onCommentCreated={handleCommentCreated}
                onCommentUpdated={handleCommentUpdated}
                onCommentDeleted={handleCommentDeleted}
                variant={variant}
              />
            ))}
            {anchorDate && hasMoreAfterDate && (
              <div className="py-3 text-center text-[11px] text-[var(--muted)]">
                {loadingMore ? '다음 글을 불러오는 중' : '아래로 스크롤하면 다음 글을 불러옵니다'}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        {/* Input area */}
        {canCreatePost && (
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

            {isBusiness && (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTaskMode(value => !value)}
                  className="rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition-colors"
                  style={{
                    borderColor: taskMode ? 'var(--indigo-300)' : 'var(--line)',
                    background: taskMode ? 'var(--indigo-50)' : 'white',
                    color: taskMode ? 'var(--indigo-700)' : 'var(--stone-600)',
                  }}
                  aria-pressed={taskMode}
                >
                  업무 등록
                </button>
                {taskMode && (
                  <>
                    <select
                      value={taskAssigneeId}
                      onChange={e => setTaskAssigneeId(e.target.value)}
                      className="rounded-lg border px-2.5 py-1.5 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                      style={{ borderColor: 'var(--line)', background: 'white', color: 'var(--foreground)' }}
                      aria-label="담당자"
                    >
                      <option value="" disabled>@ 담당자</option>
                      {assigneeOptions.map(profile => (
                        <option key={profile.id} value={profile.id}>@{profile.name}</option>
                      ))}
                    </select>
                  </>
                )}
              </div>
            )}

            <form onSubmit={handleSend} className="flex items-end gap-2">
              <Avatar initial={currentUserProfile.avatarInitial} color={currentUserProfile.avatarColor} size="sm" />

              <div className="relative flex-1 rounded-xl border transition-colors focus-within:border-[var(--indigo-400)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                {showMentionOptions && (
                  <div
                    className="absolute bottom-full left-0 z-50 mb-2 max-h-64 w-full overflow-y-auto rounded-lg border bg-white p-1 shadow-lg"
                    style={{ borderColor: 'var(--line)' }}
                    role="listbox"
                    aria-label="멘션할 회원 선택"
                  >
                    <div className="px-2 py-1 text-[10px] font-semibold text-[var(--stone-400)]">알림 대상</div>
                    {mentionOptions.map((profile, index) => (
                      <button
                        key={profile.id}
                        type="button"
                        onMouseDown={e => {
                          e.preventDefault();
                          insertMention(profile);
                        }}
                        className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left"
                        style={{
                          background: index === mentionIndex ? 'var(--indigo-50)' : 'transparent',
                          color: 'var(--foreground)',
                        }}
                        role="option"
                        aria-selected={index === mentionIndex}
                      >
                        <Avatar initial={profile.avatarInitial} color={profile.avatarColor} size="sm" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold">{profile.name}</span>
                          <span className="block truncate text-[10px] text-[var(--stone-500)]">{profile.position || '직책 없음'}</span>
                        </span>
                        <span className="text-[11px] font-semibold text-[var(--indigo-600)]">@{profile.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                <textarea
                  ref={textareaRef}
                  value={message}
                  rows={1}
                  onChange={e => {
                    setMessage(e.target.value);
                    updateMentionToken(e.target.value, e.target.selectionStart);
                    autoResize();
                  }}
                  onClick={e => updateMentionToken(message, e.currentTarget.selectionStart)}
                  onBlur={() => window.setTimeout(() => setMentionToken(null), 120)}
                  onKeyDown={e => {
                    if (showMentionOptions) {
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setMentionIndex(index => (index + 1) % mentionOptions.length);
                        return;
                      }
                      if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setMentionIndex(index => (index - 1 + mentionOptions.length) % mentionOptions.length);
                        return;
                      }
                      if (e.key === 'Enter' || e.key === 'Tab') {
                        e.preventDefault();
                        insertMention(mentionOptions[mentionIndex] ?? mentionOptions[0]);
                        return;
                      }
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setMentionToken(null);
                        return;
                      }
                    }
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend(e as unknown as React.FormEvent);
                    }
                  }}
                  placeholder="메시지를 입력하세요..."
                  className="w-full px-4 py-2.5 text-[11px] outline-none resize-none bg-transparent"
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
                disabled={(!message.trim() && pendingFiles.length === 0) || sending || (isBusiness && taskMode && !taskAssigneeId)}
                className="p-2.5 rounded-xl flex-shrink-0 disabled:opacity-30 transition-all"
                style={{
                  background: (message.trim() || pendingFiles.length > 0) && !(isBusiness && taskMode && !taskAssigneeId) ? 'var(--indigo-600)' : 'var(--stone-200)',
                  color: (message.trim() || pendingFiles.length > 0) && !(isBusiness && taskMode && !taskAssigneeId) ? 'white' : 'var(--stone-400)',
                }}
              >
                <Send size={15} />
              </button>
            </form>
            {error && (
              <p className="mt-2 text-[11px] text-[var(--danger)]">{error}</p>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        </div>
        )}
      </div>

      <FeedCalendarPanel
        pinnedPosts={visiblePinnedPosts}
        profiles={profiles}
        dateCounts={calendarDateCounts}
        activeDate={activeDate}
        onSelectPinnedPost={post => void handleSelectPinnedPost(post)}
        onSelectDate={date => void handleSelectDate(date)}
        onJumpLatest={handleJumpLatest}
        variant={variant}
      />
    </div>
  );
}
