'use server';
import { revalidatePath } from 'next/cache';
import { createMemo, updateMemo } from '@/lib/db/memos';
import { getCurrentProfile } from '@/lib/db/profiles';
import { createClient } from '@/lib/supabase/server';

export async function saveMemo(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const id = formData.get('id') as string | null;
  const title = (formData.get('title') as string ?? '').trim();
  const content = (formData.get('content') as string ?? '').trim();
  const tagsRaw = (formData.get('tags') as string ?? '').trim();
  const isPinned = formData.get('isPinnedCheck') === 'on';
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];

  try {
    if (id) {
      // Verify ownership before updating
      const supabase = await createClient();
      const { data: existing } = await supabase
        .from('work_memos')
        .select('author_id')
        .eq('id', id)
        .single();
      if (!existing || existing.author_id !== user.id) {
        return { success: false, error: '수정 권한이 없습니다.' };
      }
      await updateMemo(id, { title, content, tags, isPinned });
    } else {
      await createMemo({ authorId: user.id, title, content, tags, isPinned });
    }
    revalidatePath('/memo');
    return { success: true };
  } catch {
    return { success: false, error: '저장 중 오류가 발생했습니다.' };
  }
}
