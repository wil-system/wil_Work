import { createClient } from '@/lib/supabase/server';
import type { Board, BoardPermission, BoardRole } from '@/lib/types';

function toBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    icon: row.icon as string,
    isPublic: row.is_public as boolean,
    displayOrder: Number(row.display_order ?? 0),
    createdAt: (row.created_at as string).slice(0, 10),
  };
}

export async function getAllBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_boards')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toBoard);
}

export async function getAccessibleBoards(userId: string): Promise<Board[]> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('work_profiles').select('role').eq('id', userId).single();

  if (profile?.role === 'admin') {
    const { data, error } = await supabase
      .from('work_boards')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data ?? []).map(toBoard);
  }

  const { data: perms, error: permsError } = await supabase
    .from('work_board_permissions').select('board_id').eq('profile_id', userId);
  if (permsError) throw permsError;
  const permittedIds = (perms ?? []).map((p: { board_id: string }) => p.board_id);

  const { data, error } = await supabase
    .from('work_boards')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map(toBoard).filter(b => b.isPublic || permittedIds.includes(b.id));
}

export async function getAllBoardPermissions(): Promise<BoardPermission[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from('work_board_permissions').select('*');
  if (error) throw error;
  return (data ?? []).map((r: { profile_id: string; board_id: string }) => ({
    profileId: r.profile_id,
    boardId: r.board_id,
    role: ((r as { board_role?: BoardPermission['role'] }).board_role ?? 'member'),
  }));
}

export async function getBoardPermissionRole(profileId: string, boardId: string): Promise<BoardRole> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_board_permissions')
    .select('board_role')
    .eq('profile_id', profileId)
    .eq('board_id', boardId)
    .maybeSingle();

  if (error) throw error;
  return ((data?.board_role as BoardRole | null) ?? 'member');
}

export async function toggleBoardPermission(profileId: string, boardId: string, grant: boolean): Promise<void> {
  const supabase = await createClient();
  if (grant) {
    const { error } = await supabase.from('work_board_permissions').upsert({ profile_id: profileId, board_id: boardId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from('work_board_permissions')
      .delete().eq('profile_id', profileId).eq('board_id', boardId);
    if (error) throw error;
  }
}

export async function removeBoardPermission(profileId: string, boardId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('work_board_permissions')
    .delete()
    .eq('profile_id', profileId)
    .eq('board_id', boardId);
  if (error) throw error;
}

export async function setBoardPermissionRole(
  profileId: string,
  boardId: string,
  role: NonNullable<BoardPermission['role']>
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('work_board_permissions')
    .upsert({
      profile_id: profileId,
      board_id: boardId,
      board_role: role,
    });
  if (error) throw error;
}

export async function createBoard(board: Omit<Board, 'createdAt'>): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('work_boards').insert({
    id: board.id,
    name: board.name,
    description: board.description,
    icon: board.icon,
    is_public: board.isPublic,
    display_order: board.displayOrder ?? 1000,
  });
  if (error) throw error;
}

export async function deleteBoard(boardId: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from('work_boards')
    .delete()
    .eq('id', boardId)
    .not('id', 'in', '(feed,notice)');
  if (error) throw error;
}

export async function updateBoardSettings(
  boards: Array<Pick<Board, 'id' | 'name' | 'isPublic' | 'displayOrder'>>
): Promise<void> {
  const supabase = await createClient();
  const results = await Promise.all(boards.map(board =>
    supabase
      .from('work_boards')
      .update({
        name: board.name,
        is_public: board.isPublic,
        display_order: board.displayOrder,
      })
      .eq('id', board.id)
  ));

  const error = results.find(result => result.error)?.error;
  if (error) throw error;
}
