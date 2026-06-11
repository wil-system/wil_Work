import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calendarEventFromRow,
  cleanTodoDescription,
  buildTaskWeekRows,
  getCalendarItemsForDate,
  getCalendarListSectionKeys,
  getCalendarWeekIndexForDate,
  getMobileCalendarSectionKeys,
  getMonthDateRange,
  getTodoDescriptionMeta,
  markTodoDescription,
  splitCalendarItems,
  updateTodoDescriptionMeta,
} from '../lib/calendar-items.ts';
import type { CalendarEvent } from '../lib/types.ts';

const items: CalendarEvent[] = [
  {
    id: 'event-1',
    title: 'standup',
    date: '2026-06-10',
    allDay: false,
    type: 'meeting',
    attendees: [],
  },
  {
    id: 'todo-1',
    title: 'send proposal',
    date: '2026-06-10',
    allDay: true,
    type: 'todo',
    attendees: [],
    completed: false,
  },
  {
    id: 'todo-2',
    title: 'archive notes',
    date: '2026-06-11',
    allDay: true,
    type: 'todo',
    attendees: [],
    completed: true,
  },
];

test('separates todo items from scheduled calendar events', () => {
  const separated = splitCalendarItems(items);

  assert.deepEqual(separated.events.map(item => item.id), ['event-1']);
  assert.deepEqual(separated.todos.map(item => item.id), ['todo-1', 'todo-2']);
});

test('treats legacy-compatible personal items with todo marker as todos', () => {
  const separated = splitCalendarItems([
    {
      id: 'legacy-todo',
      title: 'call vendor',
      date: '2026-06-12',
      allDay: true,
      type: 'personal',
      attendees: [],
      description: markTodoDescription('quote check'),
    },
  ]);

  assert.deepEqual(separated.events, []);
  assert.equal(separated.todos[0].type, 'todo');
  assert.equal(separated.todos[0].description, 'quote check');
});

test('keeps empty todo descriptions hidden after marker cleanup', () => {
  assert.equal(cleanTodoDescription(markTodoDescription('')), undefined);
});

test('stores todo completion and pastel color in the marker metadata', () => {
  const description = markTodoDescription('quote check', {
    completed: true,
    color: 'mint',
  });

  assert.equal(cleanTodoDescription(description), 'quote check');
  assert.deepEqual(getTodoDescriptionMeta(description), {
    completed: true,
    color: 'mint',
  });
});

test('updates todo metadata without losing the visible memo text', () => {
  const original = markTodoDescription('quote check', {
    completed: false,
    color: 'lemon',
  });
  const updated = updateTodoDescriptionMeta(original, {
    completed: true,
    color: 'sky',
  });

  assert.equal(cleanTodoDescription(updated), 'quote check');
  assert.deepEqual(getTodoDescriptionMeta(updated), {
    completed: true,
    color: 'sky',
  });
});

test('normalizes todo marker metadata into calendar item fields', () => {
  const separated = splitCalendarItems([
    {
      id: 'color-todo',
      title: 'call vendor',
      date: '2026-06-12',
      allDay: true,
      type: 'personal',
      attendees: [],
      description: markTodoDescription('quote check', {
        completed: true,
        color: 'peach',
      }),
    },
  ]);

  assert.equal(separated.todos[0].completed, true);
  assert.equal(separated.todos[0].todoColor, 'peach');
  assert.equal(separated.todos[0].description, 'quote check');
});

test('maps database todo rows without a completed column from marker metadata', () => {
  const row = {
    id: 'db-todo',
    title: 'check invoice',
    date: '2026-06-14',
    end_date: null,
    all_day: true,
    type: 'personal',
    attendees: null,
    description: markTodoDescription('paid by friday', {
      completed: true,
      color: 'mint',
    }),
  };

  const item = calendarEventFromRow(row);

  assert.equal(item.type, 'todo');
  assert.equal(item.completed, true);
  assert.equal(item.todoColor, 'mint');
  assert.equal(item.description, 'paid by friday');
});

test('filters calendar items by selected day without mixing dates', () => {
  const selected = getCalendarItemsForDate(items, '2026-06-10');

  assert.deepEqual(selected.map(item => item.id), ['event-1', 'todo-1']);
});

test('exposes schedule and todo desktop list sections', () => {
  assert.deepEqual(getCalendarListSectionKeys(), ['event', 'todo']);
});

test('shows only schedule sections on the mobile calendar tab', () => {
  assert.deepEqual(getMobileCalendarSectionKeys(), ['event']);
});

test('builds valid month date ranges using the actual last day', () => {
  assert.deepEqual(getMonthDateRange(2026, 5), {
    from: '2026-06-01',
    to: '2026-06-30',
  });
  assert.deepEqual(getMonthDateRange(2028, 1), {
    from: '2028-02-01',
    to: '2028-02-29',
  });
});

test('builds week rows that cover the selected month with sunday starts', () => {
  const rows = buildTaskWeekRows(2026, 5);

  assert.equal(rows[0][0].date, '2026-05-31');
  assert.equal(rows[0][1].date, '2026-06-01');
  assert.equal(rows.at(-1)?.[6].date, '2026-07-04');
  assert.equal(rows.flat().filter(day => day.inMonth).length, 30);
});

test('finds the week row that contains the selected date', () => {
  const rows = buildTaskWeekRows(2026, 5);

  assert.equal(getCalendarWeekIndexForDate(rows, '2026-06-10'), 1);
  assert.equal(getCalendarWeekIndexForDate(rows, '2026-06-30'), 4);
  assert.equal(getCalendarWeekIndexForDate(rows, '2026-08-01'), 0);
});
