'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/db/profiles';

export async function toggleMemberRole(formData: FormData): Promise<void> {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== 'admin') return;

  const targetId = formData.get('targetId') as string;
  const currentRole = formData.get('currentRole') as string;
  const newRole = currentRole === 'admin' ? 'member' : 'admin';

  const supabase = await createClient();
  await supabase.from('work_profiles').update({ role: newRole }).eq('id', targetId);
  revalidatePath('/admin/members');
}
