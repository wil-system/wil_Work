'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/db/profiles';
import { createClient } from '@/lib/supabase/server';

export async function createEvent(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const title = (formData.get('title') as string ?? '').trim();
  const date = (formData.get('date') as string ?? '').trim();
  const type = (formData.get('type') as string) || 'meeting';
  const description = (formData.get('description') as string ?? '').trim();
  const allDay = formData.get('allDay') === 'on';

  if (!title || !date) return { success: false, error: '제목과 날짜는 필수입니다.' };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('work_calendar_events').insert({
      title,
      date,
      all_day: allDay,
      type,
      attendees: [],
      description: description || null,
      created_by: user.id,
    });
    if (error) return { success: false, error: '저장 중 오류가 발생했습니다.' };
    revalidatePath('/calendar');
    return { success: true };
  } catch {
    return { success: false, error: '저장 중 오류가 발생했습니다.' };
  }
}
