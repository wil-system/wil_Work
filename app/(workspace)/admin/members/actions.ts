'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { getCurrentProfile } from '@/lib/db/profiles';
import { isDemoMode } from '@/lib/demo-mode';
import { canDeleteMemberProfile } from '@/lib/member-management';
import { normalizeMemberUpdate, type MemberUpdateInput } from '@/lib/member-updates';

function revalidateMemberViews() {
  revalidatePath('/admin/members');
  revalidatePath('/admin/permissions');
  revalidatePath('/admin/approvals');
  revalidatePath('/', 'layout');
}

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

  revalidateMemberViews();
  return { success: true };
}

export async function deleteMember(targetId: string): Promise<{ success: boolean; error?: string }> {
  const admin = await getCurrentProfile();
  const deleteCheck = canDeleteMemberProfile(admin, targetId);
  if (!deleteCheck.allowed) return { success: false, error: deleteCheck.error };
  const adminId = admin?.id;
  if (!adminId) return { success: false, error: '관리자만 회원을 삭제할 수 있습니다.' };

  if (isDemoMode()) {
    revalidateMemberViews();
    return { success: true };
  }

  const supabase = await createClient();
  const { error, count } = await supabase
    .from('work_profiles')
    .delete({ count: 'exact' })
    .eq('id', targetId.trim())
    .neq('id', adminId);

  if (error) return { success: false, error: '회원을 삭제하지 못했습니다.' };
  if (count === 0) return { success: false, error: '삭제할 회원을 찾을 수 없습니다.' };

  revalidateMemberViews();
  return { success: true };
}
