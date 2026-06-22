'use server';
import { revalidatePath } from 'next/cache';
import { getCurrentProfile } from '@/lib/db/profiles';
import { createClient } from '@/lib/supabase/server';
import { TODO_COLORS, markTodoDescription, updateTodoDescriptionMeta } from '@/lib/calendar-items';
import type { CalendarEvent, TodoColor } from '@/lib/types';

const CALENDAR_ITEM_TYPES = new Set<CalendarEvent['type']>([
  'meeting',
  'deadline',
  'holiday',
  'personal',
  'todo',
]);

export async function createEvent(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const title = (formData.get('title') as string ?? '').trim();
  const date = (formData.get('date') as string ?? '').trim();
  const requestedType = (formData.get('type') as CalendarEvent['type'] | null) || 'meeting';
  const type = CALENDAR_ITEM_TYPES.has(requestedType) ? requestedType : 'meeting';
  const description = (formData.get('description') as string ?? '').trim();
  const requestedTodoColor = formData.get('todoColor') as TodoColor | null;
  const todoColor = requestedTodoColor && TODO_COLORS.includes(requestedTodoColor)
    ? requestedTodoColor
    : 'lemon';
  const isTodo = type === 'todo';
  const allDay = isTodo ? true : formData.get('allDay') === 'on';
  const storedType = isTodo ? 'personal' : type;
  const storedDescription = isTodo
    ? markTodoDescription(description, { color: todoColor })
    : description || null;

  if (!title || !date) return { success: false, error: '제목과 날짜는 필수입니다.' };

  try {
    const supabase = await createClient();
    const { error } = await supabase.from('work_calendar_events').insert({
      title,
      date,
      all_day: allDay,
      type: storedType,
      attendees: [],
      description: storedDescription,
      created_by: user.id,
    });
    if (error) {
      console.error('createEvent insert failed', {
        code: error.code,
        message: error.message,
        details: error.details,
      });
      return { success: false, error: '저장 중 오류가 발생했습니다.' };
    }
    revalidatePath('/calendar');
    return { success: true };
  } catch {
    return { success: false, error: '저장 중 오류가 발생했습니다.' };
  }
}

export async function updateTodoCompletion(
  id: string,
  completed: boolean,
): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };
  if (!id) return { success: false, error: '할일을 찾을 수 없습니다.' };

  try {
    const supabase = await createClient();
    const { data, error: fetchError } = await supabase
      .from('work_calendar_events')
      .select('description')
      .eq('id', id)
      .eq('created_by', user.id)
      .single();

    if (fetchError || !data) {
      console.error('updateTodoCompletion fetch failed', {
        code: fetchError?.code,
        message: fetchError?.message,
        details: fetchError?.details,
      });
      return { success: false, error: '할일을 찾을 수 없습니다.' };
    }

    const nextDescription = updateTodoDescriptionMeta(data.description as string | undefined, {
      completed,
    });
    const { error: updateError } = await supabase
      .from('work_calendar_events')
      .update({ description: nextDescription })
      .eq('id', id)
      .eq('created_by', user.id);

    if (updateError) {
      console.error('updateTodoCompletion update failed', {
        code: updateError.code,
        message: updateError.message,
        details: updateError.details,
      });
      return { success: false, error: '할일 상태 저장 중 오류가 발생했습니다.' };
    }

    revalidatePath('/calendar');
    return { success: true };
  } catch {
    return { success: false, error: '할일 상태 저장 중 오류가 발생했습니다.' };
  }
}
