'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/db/profiles';
import { removeBoardPermission, setBoardPermissionRole } from '@/lib/db/boards';
import type { BoardRole } from '@/lib/types';

export interface SaveBoardPermissionsState {
  success: boolean;
  message: string;
}

export async function saveBoardPermissions(
  _previousState: SaveBoardPermissionsState,
  formData: FormData,
): Promise<SaveBoardPermissionsState> {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== 'admin') {
    return { success: false, message: '관리자만 저장할 수 있습니다.' };
  }

  const pairs = formData.getAll('permissionPair').map(String);

  await Promise.all(pairs.flatMap(pair => {
    const [profileId, boardId] = pair.split(':');
    if (!profileId || !boardId) return [];

    const allowed = formData.get(`allow:${pair}`) === 'true';
    const role = formData.get(`role:${pair}`) as BoardRole | null;

    if (!allowed) return [removeBoardPermission(profileId, boardId)];
    if (role !== 'leader' && role !== 'member') return [];

    return [setBoardPermissionRole(profileId, boardId, role)];
  }));

  revalidatePath('/admin/permissions');
  revalidatePath('/', 'layout');

  return { success: true, message: '저장되었습니다.' };
}
