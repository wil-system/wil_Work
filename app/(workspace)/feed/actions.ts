'use server';

import {
  getBoardPostById,
  getBoardPostsFromDate,
  getLatestBoardPosts,
  getOlderBoardPosts,
  type FeedPostPage,
} from '@/lib/db/posts';

export async function loadLatestFeedPosts(boardId = 'feed'): Promise<FeedPostPage> {
  return getLatestBoardPosts(boardId, 20);
}

export async function loadOlderFeedPosts(beforeCreatedAt: string, boardId = 'feed'): Promise<FeedPostPage> {
  return getOlderBoardPosts(boardId, beforeCreatedAt, 20);
}

export async function loadFeedPostsFromDate(date: string, afterCreatedAt?: string, boardId = 'feed'): Promise<FeedPostPage> {
  return getBoardPostsFromDate(boardId, date, afterCreatedAt, 20);
}

export async function loadFeedPostsAroundPost(postId: string, boardId = 'feed'): Promise<FeedPostPage> {
  const post = await getBoardPostById(boardId, postId);
  if (!post) return { posts: [], hasMore: false };
  return getBoardPostsFromDate(
    boardId,
    new Date(post.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }),
    undefined,
    200
  );
}

export async function loadFeedPostById(postId: string, boardId = 'feed') {
  return getBoardPostById(boardId, postId);
}
