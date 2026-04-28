import { createClient } from '@/lib/supabase/server';
import type { Post, Comment, Attachment } from '@/lib/types';

function toPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    boardId: row.board_id as string,
    authorId: row.author_id as string,
    title: row.title as string | undefined,
    content: row.content as string,
    attachments: ((row.work_attachments as Record<string, unknown>[]) ?? []).map(a => ({
      id: a.id as string,
      name: a.name as string,
      size: a.size as string,
      type: a.type as Attachment['type'],
    })),
    comments: ((row.work_comments as Record<string, unknown>[]) ?? []).map(c => ({
      id: c.id as string,
      authorId: c.author_id as string,
      content: c.content as string,
      createdAt: c.created_at as string,
    })),
    isPinned: row.is_pinned as boolean,
    createdAt: row.created_at as string,
  };
}

export async function getPostsForBoard(boardId: string): Promise<Post[]> {
  const supabase = await createClient();
  const query = supabase
    .from('work_posts')
    .select(`*, work_attachments(*), work_comments(*)`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const { data } = boardId === 'feed'
    ? await query
    : await query.eq('board_id', boardId);

  return (data ?? []).map(toPost);
}

export async function createPost(post: {
  boardId: string;
  authorId: string;
  title?: string;
  content: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('work_posts')
    .insert({
      board_id: post.boardId,
      author_id: post.authorId,
      title: post.title,
      content: post.content,
    })
    .select('id')
    .single();
  return data?.id ?? '';
}

export async function createComment(comment: {
  postId: string;
  authorId: string;
  content: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_comments').insert({
    post_id: comment.postId,
    author_id: comment.authorId,
    content: comment.content,
  });
}
