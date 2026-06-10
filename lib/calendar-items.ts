import type { CalendarEvent, TodoColor } from './types.ts';

export const TODO_DESCRIPTION_PREFIX = '[WIL_TODO]';
export const TODO_COLORS: TodoColor[] = ['lemon', 'mint', 'sky', 'peach', 'lavender'];

interface TodoDescriptionMeta {
  completed: boolean;
  color: TodoColor;
}

const DEFAULT_TODO_META: TodoDescriptionMeta = {
  completed: false,
  color: 'lemon',
};

export interface CalendarWeekDay {
  date: string;
  day: number;
  inMonth: boolean;
}

export type CalendarListSectionKey = 'event' | 'todo';

export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMonthDateRange(year: number, month: number): {
  from: string;
  to: string;
} {
  return {
    from: toDateKey(new Date(year, month, 1)),
    to: toDateKey(new Date(year, month + 1, 0)),
  };
}

function isTodoColor(value: unknown): value is TodoColor {
  return typeof value === 'string' && (TODO_COLORS as string[]).includes(value);
}

function readTodoDescription(description?: string): {
  body: string;
  meta: TodoDescriptionMeta;
} {
  if (!description?.startsWith(TODO_DESCRIPTION_PREFIX)) {
    return {
      body: description?.trim() ?? '',
      meta: DEFAULT_TODO_META,
    };
  }

  const afterPrefix = description.slice(TODO_DESCRIPTION_PREFIX.length);
  const lineBreakMatch = afterPrefix.match(/\r?\n/);
  const firstLine = lineBreakMatch
    ? afterPrefix.slice(0, lineBreakMatch.index)
    : afterPrefix;
  const bodyStart = lineBreakMatch
    ? TODO_DESCRIPTION_PREFIX.length + firstLine.length + lineBreakMatch[0].length
    : description.length;

  let parsedMeta: Partial<TodoDescriptionMeta> = {};
  const trimmedMeta = firstLine.trim();
  if (trimmedMeta.startsWith('{') && trimmedMeta.endsWith('}')) {
    try {
      const raw = JSON.parse(trimmedMeta) as Record<string, unknown>;
      parsedMeta = {
        completed: typeof raw.completed === 'boolean' ? raw.completed : undefined,
        color: isTodoColor(raw.color) ? raw.color : undefined,
      };
    } catch {
      parsedMeta = {};
    }
  }

  return {
    body: description.slice(bodyStart).trim(),
    meta: {
      ...DEFAULT_TODO_META,
      ...parsedMeta,
    },
  };
}

export function markTodoDescription(
  description: string,
  meta: Partial<TodoDescriptionMeta> = {},
): string {
  const cleanDescription = description.trim();
  const nextMeta: TodoDescriptionMeta = {
    ...DEFAULT_TODO_META,
    ...meta,
  };
  const metaLine = JSON.stringify(nextMeta);
  return cleanDescription
    ? `${TODO_DESCRIPTION_PREFIX}${metaLine}\n${cleanDescription}`
    : `${TODO_DESCRIPTION_PREFIX}${metaLine}`;
}

export function cleanTodoDescription(description?: string): string | undefined {
  if (!description?.startsWith(TODO_DESCRIPTION_PREFIX)) return description || undefined;

  const cleanDescription = readTodoDescription(description).body;

  return cleanDescription || undefined;
}

export function getTodoDescriptionMeta(description?: string): TodoDescriptionMeta {
  return readTodoDescription(description).meta;
}

export function updateTodoDescriptionMeta(
  description: string | undefined,
  meta: Partial<TodoDescriptionMeta>,
): string {
  const current = readTodoDescription(description);
  return markTodoDescription(current.body, {
    ...current.meta,
    ...meta,
  });
}

export function normalizeCalendarItem(item: CalendarEvent): CalendarEvent {
  if (item.type === 'todo' || item.description?.startsWith(TODO_DESCRIPTION_PREFIX)) {
    const meta = getTodoDescriptionMeta(item.description);
    return {
      ...item,
      type: 'todo',
      description: cleanTodoDescription(item.description),
      completed: item.completed ?? meta.completed,
      todoColor: item.todoColor ?? meta.color,
    };
  }

  return item;
}

export function calendarEventFromRow(row: Record<string, unknown>): CalendarEvent {
  return normalizeCalendarItem({
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    endDate: row.end_date as string | undefined,
    allDay: row.all_day as boolean,
    type: row.type as CalendarEvent['type'],
    attendees: (row.attendees as string[] | null) ?? [],
    description: row.description as string | undefined,
    ...(typeof row.completed === 'boolean' ? { completed: row.completed } : {}),
  });
}

export function splitCalendarItems(items: CalendarEvent[]): {
  events: CalendarEvent[];
  todos: CalendarEvent[];
} {
  const sorted = items.map(normalizeCalendarItem).sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.title.localeCompare(b.title);
  });

  return {
    events: sorted.filter(item => item.type !== 'todo'),
    todos: sorted.filter(item => item.type === 'todo'),
  };
}

export function getCalendarItemsForDate(
  items: CalendarEvent[],
  date: string,
): CalendarEvent[] {
  return items.map(normalizeCalendarItem).filter(item => item.date === date);
}

export function getCalendarListSectionKeys(): CalendarListSectionKey[] {
  return ['event', 'todo'];
}

export function getMobileCalendarSectionKeys(): CalendarListSectionKey[] {
  return ['event'];
}

export function buildTaskWeekRows(year: number, month: number): CalendarWeekDay[][] {
  const first = new Date(year, month, 1);
  const cursor = new Date(year, month, 1 - first.getDay());
  const last = new Date(year, month + 1, 0);
  const end = new Date(year, month + 1, 0 + (6 - last.getDay()));
  const rows: CalendarWeekDay[][] = [];

  while (cursor <= end) {
    const week: CalendarWeekDay[] = [];
    for (let index = 0; index < 7; index++) {
      week.push({
        date: toDateKey(cursor),
        day: cursor.getDate(),
        inMonth: cursor.getMonth() === month,
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    rows.push(week);
  }

  return rows;
}

export function getCalendarWeekIndexForDate(
  rows: CalendarWeekDay[][],
  date: string,
): number {
  const index = rows.findIndex(week => week.some(day => day.date === date));
  return index >= 0 ? index : 0;
}
