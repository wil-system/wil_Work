import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/demo-mode';
import { mockMemos } from '@/lib/mock-data';
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
  if (isDemoMode()) {
    return mockMemos
      .filter(memo => memo.authorId === authorId)
      .sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || b.updatedAt.localeCompare(a.updatedAt));
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_memos')
    .select('*')
    .eq('author_id', authorId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(toMemo);
}

export async function createMemo(memo: Omit<Memo, 'id' | 'updatedAt'>): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  const { error } = await supabase.from('work_memos').insert({
    author_id: memo.authorId,
    title: memo.title,
    content: memo.content,
    tags: memo.tags,
    is_pinned: memo.isPinned,
  });
  if (error) throw error;
}

export async function updateMemo(id: string, updates: Partial<Pick<Memo, 'title' | 'content' | 'tags' | 'isPinned'>>): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  const { error } = await supabase.from('work_memos').update({
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.content !== undefined && { content: updates.content }),
    ...(updates.tags !== undefined && { tags: updates.tags }),
    ...(updates.isPinned !== undefined && { is_pinned: updates.isPinned }),
    updated_at: new Date().toISOString(),
  }).eq('id', id);
  if (error) throw error;
}

export async function deleteMemoById(id: string, authorId: string): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  const { error } = await supabase
    .from('work_memos')
    .delete()
    .eq('id', id)
    .eq('author_id', authorId);
  if (error) throw error;
}
