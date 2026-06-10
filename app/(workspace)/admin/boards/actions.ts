'use server';
import { revalidatePath } from 'next/cache';
import { createBoard, deleteBoard, updateBoardSettings } from '@/lib/db/boards';
import { getCurrentProfile } from '@/lib/db/profiles';
import { generateBoardId } from '@/lib/board-id';

function revalidateBoardViews(boardId?: string) {
  revalidatePath('/admin/boards');
  revalidatePath('/admin/permissions');
  revalidatePath('/', 'layout');
  if (boardId) revalidatePath(`/board/${boardId}`);
}

export async function addBoard(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== 'admin') return { success: false, error: '관리자만 저장할 수 있습니다.' };

  const name = (formData.get('name') as string ?? '').trim();
  const description = (formData.get('description') as string ?? '').trim();
  const isPublic = formData.get('isPublic') === 'on';

  if (!name) return { success: false, error: '게시판 이름은 필수입니다.' };

  try {
    await createBoard({ id: generateBoardId(), name, description, icon: 'Dot', isPublic, displayOrder: 1000 });
    revalidateBoardViews();
    return { success: true };
  } catch {
    return { success: false, error: '게시판 저장 중 오류가 발생했습니다.' };
  }
}

export async function removeBoard(boardId: string): Promise<{ success: boolean; error?: string }> {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== 'admin') return { success: false, error: '관리자만 삭제할 수 있습니다.' };

  if (!boardId || boardId === 'feed' || boardId === 'notice') {
    return { success: false, error: '기본 게시판은 삭제할 수 없습니다.' };
  }

  try {
    await deleteBoard(boardId);
    revalidateBoardViews(boardId);
    return { success: true };
  } catch {
    return { success: false, error: '게시판을 삭제하지 못했습니다.' };
  }
}

export async function saveBoardSettings(
  boards: Array<{ id: string; name: string; isPublic: boolean }>
): Promise<{ success: boolean; error?: string }> {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== 'admin') return { success: false, error: '관리자만 저장할 수 있습니다.' };

  const normalized = boards.map((board, index) => ({
    id: board.id,
    name: board.name.trim(),
    isPublic: board.isPublic,
    displayOrder: index + 1,
  }));

  if (normalized.some(board => !board.id || !board.name)) {
    return { success: false, error: '게시판 이름은 비워둘 수 없습니다.' };
  }

  try {
    await updateBoardSettings(normalized);
    revalidateBoardViews();
    return { success: true };
  } catch {
    return { success: false, error: '게시판 설정을 저장하지 못했습니다.' };
  }
}
