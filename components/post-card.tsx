'use client';
import { useState } from 'react';
import { Check, Edit3, MessageSquare, Paperclip, Pin, Send, Trash2, X } from 'lucide-react';
import AttachmentViewer from './attachment-viewer';
import { Avatar } from './ui/avatar';
import { Badge } from './ui/badge';
import { createClient } from '@/lib/supabase/client';
import { renderRichText } from '@/lib/rich-text';
import type { Post } from '@/lib/types';

type ProfileInfo = { name: string; position: string; role: string; avatarInitial: string; avatarColor: string };

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  return `${Math.floor(hours / 24)}일 전`;
}

interface PostCardProps {
  post: Post;
  profiles?: Record<string, ProfileInfo>;
  currentUserId?: string;
  currentUserProfile?: ProfileInfo;
}

export default function PostCard({ post, profiles = {}, currentUserId, currentUserProfile }: PostCardProps) {
  const [currentPost, setCurrentPost] = useState(post);
  const [deleted, setDeleted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editingTitle, setEditingTitle] = useState(currentPost.title ?? '');
  const [editingContent, setEditingContent] = useState(currentPost.content);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState('');
  const author = profiles[currentPost.authorId] ?? { name: '알 수 없음', position: '', role: 'member', avatarInitial: '?', avatarColor: '#999' };
  const isMyPost = currentPost.authorId === currentUserId;

  async function handleCommentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!comment.trim() || !currentUserId) return;
    setSubmittingComment(true);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('work_comments').insert({
        post_id: currentPost.id,
        author_id: currentUserId,
        content: comment.trim(),
      }).select('id, author_id, content, created_at').single();
      if (!error && data) {
        setCurrentPost(prev => ({
          ...prev,
          comments: [
            ...prev.comments,
            {
              id: data.id as string,
              authorId: data.author_id as string,
              content: data.content as string,
              createdAt: data.created_at as string,
            },
          ],
        }));
        setComment('');
      }
    } finally {
      setSubmittingComment(false);
    }
  }

  async function savePost() {
    const nextContent = editingContent.trim();
    if (!nextContent) return;

    const nextTitle = editingTitle.trim();
    const supabase = createClient();
    const { error } = await supabase
      .from('work_posts')
      .update({ title: nextTitle || null, content: nextContent })
      .eq('id', currentPost.id);

    if (!error) {
      setCurrentPost(prev => ({ ...prev, title: nextTitle || undefined, content: nextContent }));
      setEditingPost(false);
    }
  }

  async function deletePost() {
    if (!window.confirm('글을 삭제하시겠습니까? 삭제된 글은 복구할 수 없습니다.')) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('work_posts')
      .delete()
      .eq('id', currentPost.id);

    if (!error) setDeleted(true);
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
      setCurrentPost(prev => ({
        ...prev,
        comments: prev.comments.map(item => item.id === commentId ? { ...item, content: next } : item),
      }));
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

    if (!error) {
      setCurrentPost(prev => ({
        ...prev,
        comments: prev.comments.filter(item => item.id !== commentId),
      }));
    }
  }

  if (deleted) return null;

  return (
    <article className="card animate-fade-up">
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
        <div className="flex items-center gap-1.5">
          {isMyPost && (
            <>
              {editingPost ? (
                <>
                  <button type="button" onClick={() => void savePost()} className="p-1 rounded hover:bg-[var(--stone-100)]" aria-label="글 저장">
                    <Check size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(false);
                      setEditingTitle(currentPost.title ?? '');
                      setEditingContent(currentPost.content);
                    }}
                    className="p-1 rounded hover:bg-[var(--stone-100)]"
                    aria-label="글 수정 취소"
                  >
                    <X size={13} />
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={() => setEditingPost(true)} className="p-1 rounded hover:bg-[var(--stone-100)]" aria-label="글 수정">
                    <Edit3 size={13} />
                  </button>
                  <button type="button" onClick={() => void deletePost()} className="p-1 rounded hover:bg-[var(--stone-100)] text-[var(--danger)]" aria-label="글 삭제">
                    <Trash2 size={13} />
                  </button>
                </>
              )}
            </>
          )}
          {currentPost.isPinned && <Pin size={13} className="text-[var(--indigo-500)] mt-0.5" />}
        </div>
      </div>

      <div className="border-t mx-5" style={{ borderColor: 'var(--line)' }} />

      <div className="px-5 py-3">
        {editingPost ? (
          <div className="space-y-2">
            <input
              value={editingTitle}
              onChange={e => setEditingTitle(e.target.value)}
              placeholder="제목"
              className="w-full px-3 py-2 rounded-lg border text-[13px] font-semibold outline-none"
              style={{ borderColor: 'var(--line)', background: 'white', color: 'var(--foreground)' }}
            />
            <textarea
              value={editingContent}
              onChange={e => setEditingContent(e.target.value)}
              rows={4}
              className="w-full resize-none px-3 py-2 rounded-lg border text-[13px] outline-none"
              style={{ borderColor: 'var(--line)', background: 'white', color: 'var(--foreground)' }}
            />
          </div>
        ) : (
          <>
            {currentPost.title && (
              <h2 className="text-[14px] font-bold text-[var(--foreground)] mb-1.5">{currentPost.title}</h2>
            )}
            <p
              className="text-[13px] text-[var(--stone-700)] leading-relaxed whitespace-pre-line"
            >
              {renderRichText(currentPost.content)}
            </p>
          </>
        )}
        {currentPost.attachments.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {currentPost.attachments.map(a => <AttachmentViewer key={a.id} attachment={a} compact />)}
          </div>
        )}
      </div>

      <div className="border-t mx-5 pt-2 pb-3 flex items-center gap-2" style={{ borderColor: 'var(--line)' }}>
        <button
          onClick={() => setShowComments(o => !o)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors hover:bg-[var(--stone-100)]"
          style={{ color: showComments ? 'var(--indigo-600)' : 'var(--muted)' }}
        >
          <MessageSquare size={13} />
          <span>댓글 {currentPost.comments.length}개</span>
        </button>
        {currentPost.attachments.length > 0 && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-[var(--muted)]">
            <Paperclip size={13} />
            <span>첨부 {currentPost.attachments.length}개</span>
          </span>
        )}
      </div>

      {showComments && (
        <div className="border-t bg-[var(--stone-50)] rounded-b-[14px]" style={{ borderColor: 'var(--line)' }}>
          {currentPost.comments.map(c => {
            const ca = profiles[c.authorId] ?? { name: '알 수 없음', avatarInitial: '?', avatarColor: '#999' };
            const isMine = c.authorId === currentUserId;
            const isEditing = editingCommentId === c.id;
            return (
              <div key={c.id} className="px-5 py-3 flex gap-2.5 border-b last:border-0" style={{ borderColor: 'var(--line)' }}>
                <Avatar initial={ca.avatarInitial} color={ca.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[12px] font-semibold text-[var(--foreground)]">{ca.name}</span>
                    <span className="text-[10px] text-[var(--muted)]">{timeAgo(c.createdAt)}</span>
                    {isMine && (
                      <span className="ml-auto flex items-center gap-1">
                        {isEditing ? (
                          <>
                            <button type="button" onClick={() => void saveComment(c.id)} className="p-1 rounded hover:bg-white" aria-label="댓글 저장">
                              <Check size={12} />
                            </button>
                            <button type="button" onClick={() => { setEditingCommentId(null); setEditingComment(''); }} className="p-1 rounded hover:bg-white" aria-label="댓글 수정 취소">
                              <X size={12} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button type="button" onClick={() => { setEditingCommentId(c.id); setEditingComment(c.content); }} className="p-1 rounded hover:bg-white" aria-label="댓글 수정">
                              <Edit3 size={12} />
                            </button>
                            <button type="button" onClick={() => void deleteComment(c.id)} className="p-1 rounded hover:bg-white text-[var(--danger)]" aria-label="댓글 삭제">
                              <Trash2 size={12} />
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
                      className="w-full px-2 py-1 rounded border text-[12px] outline-none"
                      style={{ borderColor: 'var(--line)', background: 'white', color: 'var(--foreground)' }}
                    />
                  ) : (
                    <p className="text-[12px] text-[var(--stone-700)]">{c.content}</p>
                  )}
                </div>
              </div>
            );
          })}
          {currentUserId && (
            <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--line)' }}>
              <form onSubmit={handleCommentSubmit} className="flex items-center gap-2">
                {currentUserProfile && (
                  <Avatar initial={currentUserProfile.avatarInitial} color={currentUserProfile.avatarColor} size="sm" />
                )}
                <input
                  type="text"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="댓글을 입력하세요..."
                  className="flex-1 px-3 py-1.5 rounded-lg border text-[12px] outline-none focus:border-[var(--indigo-500)] focus:ring-1 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'white' }}
                />
                <button
                  type="submit"
                  disabled={!comment.trim() || submittingComment}
                  className="p-1.5 rounded-lg transition-colors disabled:opacity-40"
                  style={{ color: 'var(--indigo-600)' }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
