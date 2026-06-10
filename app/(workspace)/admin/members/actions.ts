'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/db/profiles';
import { isDemoMode } from '@/lib/demo-mode';
import { normalizeMemberUpdate, type MemberUpdateInput } from '@/lib/member-updates';

interface MemberSaveResult {
  success: boolean;
  error?: string;
}

export async function saveMemberUpdates(updates: MemberUpdateInput[]): Promise<MemberSaveResult> {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== 'admin') return { success: false, error: '관리자만 저장할 수 있습니다.' };

  const normalized = updates
    .map(normalizeMemberUpdate)
    .filter(member => member.id);

  if (normalized.length === 0) return { success: true };
  if (normalized.some(member => member.role !== 'admin' && member.role !== 'member')) {
    return { success: false, error: '유효하지 않은 권한 값이 있습니다.' };
  }

  if (isDemoMode()) return { success: true };

  const supabase = await createClient();
  const results = await Promise.all(normalized.map(member => {
    const nextRole = member.id === admin.id ? admin.role : member.role;
    return supabase
      .from('work_profiles')
      .update({
        department: member.department,
        position: member.position,
        role: nextRole,
      })
      .eq('id', member.id)
      .eq('status', 'approved');
  }));

  const error = results.find(result => result.error)?.error;
  if (error) return { success: false, error: '회원 정보를 저장하지 못했습니다.' };

  revalidatePath('/admin/members');
  revalidatePath('/', 'layout');
  return { success: true };
}
