import { createClient } from '@/lib/supabase/server';
import type { FeedDateCount, Post, Attachment } from '@/lib/types';

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
      storagePath: a.storage_path as string | undefined,
    })),
    comments: ((row.work_comments as Record<string, unknown>[]) ?? []).map(c => ({
      id: c.id as string,
      authorId: c.author_id as string,
      content: c.content as string,
      createdAt: c.created_at as string,
    })),
    isPinned: row.is_pinned as boolean,
    workStatus: row.work_status as Post['workStatus'] | undefined,
    assigneeId: row.assignee_id as string | undefined,
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

  const { data, error } = boardId === 'feed'
    ? await query
    : await query.eq('board_id', boardId);

  if (error) throw error;
  return (data ?? []).map(toPost);
}

export interface FeedPostPage {
  posts: Post[];
  hasMore: boolean;
}

const FEED_SELECT = `*, work_attachments(*), work_comments(*)`;

function pageResult(rows: Record<string, unknown>[] | null, limit: number): FeedPostPage {
  const pageRows = (rows ?? []).slice(0, limit);
  return {
    posts: pageRows.map(toPost),
    hasMore: (rows ?? []).length > limit,
  };
}

export async function getLatestFeedPosts(limit = 20): Promise<FeedPostPage> {
  return getLatestBoardPosts('feed', limit);
}

export async function getLatestBoardPosts(boardId: string, limit = 20): Promise<FeedPostPage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_posts')
    .select(FEED_SELECT)
    .eq('board_id', boardId)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (error) throw error;
  return pageResult(data, limit);
}

export async function getPinnedFeedPosts(limit = 20): Promise<Post[]> {
  return getPinnedBoardPosts('feed', limit);
}

export async function getPinnedBoardPosts(boardId: string, limit = 20): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_posts')
    .select(FEED_SELECT)
    .eq('board_id', boardId)
    .eq('is_pinned', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toPost);
}

export async function getBoardTaskPosts(boardId: string, limit = 100): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_posts')
    .select(FEED_SELECT)
    .eq('board_id', boardId)
    .not('work_status', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(toPost);
}

export async function getFeedPostById(postId: string): Promise<Post | null> {
  return getBoardPostById('feed', postId);
}

export async function getBoardPostById(boardId: string, postId: string): Promise<Post | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_posts')
    .select(FEED_SELECT)
    .eq('board_id', boardId)
    .eq('id', postId)
    .maybeSingle();

  if (error) throw error;
  return data ? toPost(data) : null;
}

export async function getOlderFeedPosts(beforeCreatedAt: string, limit = 20): Promise<FeedPostPage> {
  return getOlderBoardPosts('feed', beforeCreatedAt, limit);
}

export async function getOlderBoardPosts(boardId: string, beforeCreatedAt: string, limit = 20): Promise<FeedPostPage> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_posts')
    .select(FEED_SELECT)
    .eq('board_id', boardId)
    .lt('created_at', beforeCreatedAt)
    .order('created_at', { ascending: false })
    .limit(limit + 1);

  if (error) throw error;
  return pageResult(data, limit);
}

export async function getFeedPostsFromDate(
  date: string,
  afterCreatedAt?: string,
  limit = 20
): Promise<FeedPostPage> {
  return getBoardPostsFromDate('feed', date, afterCreatedAt, limit);
}

export async function getBoardPostsFromDate(
  boardId: string,
  date: string,
  afterCreatedAt?: string,
  limit = 20
): Promise<FeedPostPage> {
  const supabase = await createClient();
  const start = `${date}T00:00:00+09:00`;
  const query = supabase
    .from('work_posts')
    .select(FEED_SELECT)
    .eq('board_id', boardId)
    .gte('created_at', start)
    .order('created_at', { ascending: true })
    .limit(limit + 1);

  const { data, error } = afterCreatedAt
    ? await query.gt('created_at', afterCreatedAt)
    : await query;

  if (error) throw error;
  return pageResult(data, limit);
}

export async function getFeedDateCounts(): Promise<FeedDateCount[]> {
  return getBoardDateCounts('feed');
}

export async function getBoardDateCounts(boardId: string): Promise<FeedDateCount[]> {
  if (boardId === 'feed') {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_feed_post_counts_by_day');

    if (error) throw error;
    return (data ?? []).map((row: { date: string; count: number | string }) => ({
      date: row.date,
      count: Number(row.count),
    }));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_posts')
    .select('created_at')
    .eq('board_id', boardId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  const counts = new Map<string, number>();
  for (const row of data ?? []) {
    const date = new Date((row as { created_at: string }).created_at)
      .toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }
  return [...counts.entries()].map(([date, count]) => ({ date, count }));
}

export async function createPost(post: {
  boardId: string;
  authorId: string;
  title?: string;
  content: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_posts')
    .insert({
      board_id: post.boardId,
      author_id: post.authorId,
      title: post.title,
      content: post.content,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data?.id ?? '';
}

export async function createComment(comment: {
  postId: string;
  authorId: string;
  content: string;
}): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('work_comments').insert({
    post_id: comment.postId,
    author_id: comment.authorId,
    content: comment.content,
  });
  if (error) throw error;
}
