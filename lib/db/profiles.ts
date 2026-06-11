import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isDemoMode } from '@/lib/demo-mode';
import { CURRENT_USER_ID, mockProfiles } from '@/lib/mock-data';
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
  if (isDemoMode()) return mockProfiles.find(profile => profile.id === CURRENT_USER_ID) ?? null;

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
  if (isDemoMode()) return mockProfiles;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_profiles')
    .select('*')
    .order('joined_at');
  if (error) throw error;
  return (data ?? []).map(toProfile);
}

export async function getPendingProfiles(): Promise<Profile[]> {
  if (isDemoMode()) return mockProfiles.filter(profile => profile.status === 'pending');

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
  if (isDemoMode()) return;

  if (status === 'approved') {
    const adminSupabase = createAdminClient();
    const { error: authError } = await adminSupabase.auth.admin.updateUserById(id, { email_confirm: true });
    if (authError) throw authError;
  }

  const supabase = await createClient();
  const { error } = await supabase.from('work_profiles').update({ status }).eq('id', id);
  if (error) throw error;
}
