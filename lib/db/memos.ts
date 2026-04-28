import { createClient } from '@/lib/supabase/server';
import type { Memo } from '@/lib/types';

function toMemo(row: Record<string, unknown>): Memo {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    title: row.title as string,
    content: row.content as string,
    tags: row.tags as string[],
    isPinned: row.is_pinned as boolean,
    updatedAt: row.updated_at as string,
  };
}

export async function getMyMemos(authorId: string): Promise<Memo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('work_memos')
    .select('*')
    .eq('author_id', authorId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  return (data ?? []).map(toMemo);
}

export async function createMemo(memo: Omit<Memo, 'id' | 'updatedAt'>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_memos').insert({
    author_id: memo.authorId,
    title: memo.title,
    content: memo.content,
    tags: memo.tags,
    is_pinned: memo.isPinned,
  });
}

export async function updateMemo(id: string, updates: Partial<Pick<Memo, 'title' | 'content' | 'tags' | 'isPinned'>>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_memos').update({
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.content !== undefined && { content: updates.content }),
    ...(updates.tags !== undefined && { tags: updates.tags }),
    ...(updates.isPinned !== undefined && { is_pinned: updates.isPinned }),
    updated_at: new Date().toISOString(),
  }).eq('id', id);
}
