import { createClient } from '@/lib/supabase/server';
import type { Board, BoardPermission } from '@/lib/types';

function toBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    icon: row.icon as string,
    isPublic: row.is_public as boolean,
    createdAt: (row.created_at as string).slice(0, 10),
  };
}

export async function getAllBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('work_boards').select('*').order('created_at');
  return (data ?? []).map(toBoard);
}

export async function getAccessibleBoards(userId: string): Promise<Board[]> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('work_profiles').select('role').eq('id', userId).single();

  if (profile?.role === 'admin') {
    const { data } = await supabase.from('work_boards').select('*').order('created_at');
    return (data ?? []).map(toBoard);
  }

  const { data: perms } = await supabase
    .from('work_board_permissions').select('board_id').eq('profile_id', userId);
  const permittedIds = (perms ?? []).map((p: { board_id: string }) => p.board_id);

  const { data } = await supabase.from('work_boards').select('*').order('created_at');
  return (data ?? []).map(toBoard).filter(b => b.isPublic || permittedIds.includes(b.id));
}

export async function getAllBoardPermissions(): Promise<BoardPermission[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('work_board_permissions').select('*');
  return (data ?? []).map((r: { profile_id: string; board_id: string }) => ({
    profileId: r.profile_id,
    boardId: r.board_id,
  }));
}

export async function toggleBoardPermission(profileId: string, boardId: string, grant: boolean): Promise<void> {
  const supabase = await createClient();
  if (grant) {
    await supabase.from('work_board_permissions').upsert({ profile_id: profileId, board_id: boardId });
  } else {
    await supabase.from('work_board_permissions')
      .delete().eq('profile_id', profileId).eq('board_id', boardId);
  }
}

export async function createBoard(board: Omit<Board, 'createdAt'>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_boards').insert({
    id: board.id,
    name: board.name,
    description: board.description,
    icon: board.icon,
    is_public: board.isPublic,
  });
}
