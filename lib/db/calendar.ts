import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/demo-mode';
import { mockCalendarEvents } from '@/lib/mock-data';
import type { CalendarEvent } from '@/lib/types';

function toEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    endDate: row.end_date as string | undefined,
    allDay: row.all_day as boolean,
    type: row.type as CalendarEvent['type'],
    attendees: row.attendees as string[],
    description: row.description as string | undefined,
  };
}

export async function getMonthEvents(year: number, month: number): Promise<CalendarEvent[]> {
  if (isDemoMode()) {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const to = `${year}-${String(month + 1).padStart(2, '0')}-31`;
    return mockCalendarEvents
      .filter(event => event.date >= from && event.date <= to)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  const supabase = await createClient();
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month + 1).padStart(2, '0')}-31`;
  const { data } = await supabase
    .from('work_calendar_events')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date');
  return (data ?? []).map(toEvent);
}

export async function createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  await supabase.from('work_calendar_events').insert({
    title: event.title,
    date: event.date,
    end_date: event.endDate,
    all_day: event.allDay,
    type: event.type,
    attendees: event.attendees,
    description: event.description,
  });
}
