import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/demo-mode';
import { calendarEventFromRow, getMonthDateRange, markTodoDescription } from '@/lib/calendar-items';
import { mockCalendarEvents } from '@/lib/mock-data';
import type { CalendarEvent } from '@/lib/types';

function toEvent(row: Record<string, unknown>): CalendarEvent {
  return calendarEventFromRow(row);
}

export async function getMonthEvents(year: number, month: number): Promise<CalendarEvent[]> {
  const { from, to } = getMonthDateRange(year, month);

  if (isDemoMode()) {
    return mockCalendarEvents
      .filter(event => event.date >= from && event.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('work_calendar_events')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .eq('created_by', user.id)
    .order('date');
  if (error) {
    console.error('getMonthEvents query failed', {
      code: error.code,
      message: error.message,
      details: error.details,
      from,
      to,
    });
    return [];
  }
  return (data ?? []).map(toEvent);
}

export async function createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Login required');

  const isTodo = event.type === 'todo';
  await supabase.from('work_calendar_events').insert({
    title: event.title,
    date: event.date,
    end_date: event.endDate,
    all_day: isTodo ? true : event.allDay,
    type: isTodo ? 'personal' : event.type,
    attendees: event.attendees,
    description: isTodo ? markTodoDescription(event.description ?? '') : event.description,
    created_by: user.id,
  });
}
