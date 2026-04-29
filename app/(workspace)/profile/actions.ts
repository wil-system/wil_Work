'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/db/profiles';
import { createClient } from '@/lib/supabase/server';

export async function updateProfile(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const name = (formData.get('name') as string ?? '').trim();
  const department = (formData.get('department') as string ?? '').trim();
  const position = (formData.get('position') as string ?? '').trim();

  if (!name) return { success: false, error: '이름은 필수입니다.' };

  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('work_profiles')
      .update({ name, department, position })
      .eq('id', user.id);
    if (error) return { success: false, error: '저장 중 오류가 발생했습니다.' };
    revalidatePath('/profile');
    return { success: true };
  } catch {
    return { success: false, error: '저장 중 오류가 발생했습니다.' };
  }
}
