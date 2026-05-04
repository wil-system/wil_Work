import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as Profile['role'],
    status: row.status as Profile['status'],
    department: row.department as string,
    position: row.position as string,
    avatarInitial: row.avatar_initial as string,
    avatarColor: row.avatar_color as string,
    joinedAt: (row.joined_at as string).slice(0, 10),
  };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('work_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) return null;
  return data ? toProfile(data) : null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_profiles')
    .select('*')
    .order('joined_at');
  if (error) throw error;
  return (data ?? []).map(toProfile);
}

export async function getPendingProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_profiles')
    .select('*')
    .eq('status', 'pending')
    .order('joined_at');
  if (error) throw error;
  return (data ?? []).map(toProfile);
}

export async function updateProfileStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from('work_profiles').update({ status }).eq('id', id);
  if (error) throw error;
}
