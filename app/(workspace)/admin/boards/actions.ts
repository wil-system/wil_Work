'use server';
import { revalidatePath } from 'next/cache';
import { createBoard } from '@/lib/db/boards';

export async function addBoard(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const name = (formData.get('name') as string ?? '').trim();
  const id = (formData.get('id') as string ?? '').trim().toLowerCase().replace(/\s+/g, '-');
  const description = (formData.get('description') as string ?? '').trim();
  const isPublic = formData.get('isPublic') === 'on';

  if (!name || !id) return { success: false, error: '게시판 ID와 이름은 필수입니다.' };

  try {
    await createBoard({ id, name, description, icon: 'Bell', isPublic });
    revalidatePath('/admin/boards');
    return { success: true };
  } catch {
    return { success: false, error: '이미 존재하는 게시판 ID이거나 저장 중 오류가 발생했습니다.' };
  }
}
