'use server';
import { revalidatePath } from 'next/cache';
import { upsertReport } from '@/lib/db/reports';
import { getCurrentProfile } from '@/lib/db/profiles';

export async function submitReport(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const completedText = (formData.get('completed') as string) ?? '';
  const plannedText = (formData.get('planned') as string) ?? '';
  const issues = (formData.get('issues') as string) ?? '';

  const completedTasks = completedText.split('\n').map(s => s.trim()).filter(Boolean);
  const plannedTasks = plannedText.split('\n').map(s => s.trim()).filter(Boolean);

  try {
    await upsertReport({
      authorId: user.id,
      date: new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' }),
      completedTasks,
      plannedTasks,
      issues: issues.trim() || undefined,
      status: 'submitted',
    });
    revalidatePath('/work-report');
    return { success: true };
  } catch {
    return { success: false, error: '저장 중 오류가 발생했습니다.' };
  }
}
