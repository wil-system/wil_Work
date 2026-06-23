'use client';
import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  CalendarDays,
  CheckSquare2,
  ChevronLeft,
  ChevronRight,
  Edit3,
  ListTodo,
  Plus,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { createEvent, deleteEvent, updateEvent, updateTodoCompletion } from '@/app/(workspace)/calendar/actions';
import {
  TODO_COLORS,
  buildTaskWeekRows,
  calendarEventFromRow,
  getCalendarItemsForDate,
  getCalendarListSectionKeys,
  getCalendarWeekIndexForDate,
  getMobileCalendarSectionKeys,
  getMonthDateRange,
  splitCalendarItems,
  toDateKey,
} from '@/lib/calendar-items';
import type { CalendarEvent, TodoColor } from '@/lib/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TYPE_VARIANT: Record<CalendarEvent['type'], 'indigo' | 'green' | 'yellow' | 'red' | 'gray'> = {
  meeting: 'indigo',
  deadline: 'red',
  holiday: 'yellow',
  personal: 'green',
  todo: 'gray',
};
const TYPE_LABEL: Record<CalendarEvent['type'], string> = {
  meeting: '미팅',
  deadline: '마감',
  holiday: '휴일',
  personal: '개인',
  todo: '할일',
};
const TYPE_BG: Record<CalendarEvent['type'], string> = {
  meeting: 'bg-[var(--indigo-50)] text-[var(--indigo-700)]',
  deadline: 'bg-[#fee2e2] text-[#991b1b]',
  holiday: 'bg-[#fef9c3] text-[#92400e]',
  personal: 'bg-[#d1fae5] text-[#065f46]',
  todo: 'bg-[var(--stone-100)] text-[var(--stone-700)]',
};
const TODO_COLOR_STYLE: Record<TodoColor, {
  label: string;
  background: string;
  border: string;
  accent: string;
}> = {
  lemon: {
    label: '레몬',
    background: '#fef9c3',
    border: '#fde68a',
    accent: '#d97706',
  },
  mint: {
    label: '민트',
    background: '#d1fae5',
    border: '#86efac',
    accent: '#059669',
  },
  sky: {
    label: '하늘',
    background: '#dbeafe',
    border: '#93c5fd',
    accent: '#2563eb',
  },
  peach: {
    label: '피치',
    background: '#ffedd5',
    border: '#fdba74',
    accent: '#ea580c',
  },
  lavender: {
    label: '라벤더',
    background: '#ede9fe',
    border: '#c4b5fd',
    accent: '#7c3aed',
  },
};

type FormMode = 'event' | 'todo';
type MobileTab = 'calendar' | 'todo';
type DesktopListTab = 'event' | 'todo';

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function getInitialTaskDate(year: number, month: number) {
  const today = new Date();
  if (today.getFullYear() === year && today.getMonth() === month) {
    return toDateKey(today);
  }
  return toDateKey(new Date(year, month, 1));
}

function formatLongDate(date: string) {
  const [, month, day] = date.split('-');
  const dayIndex = new Date(`${date}T00:00:00`).getDay();
  return `${Number(month)}월 ${Number(day)}일 ${DAYS[dayIndex]}요일`;
}

interface CalendarClientProps {
  initialYear: number;
  initialMonth: number;
  initialEvents: CalendarEvent[];
  currentUserId: string;
}

interface TaskPanelProps {
  todos: CalendarEvent[];
  year: number;
  month: number;
  selectedDate: string;
  pendingTodoId: string;
  onSelectDate: (date: string) => void;
  onAddTodo: (date: string) => void;
  onToggleTodo: (todo: CalendarEvent) => void;
  onEditTodo: (todo: CalendarEvent) => void;
  mode?: 'date' | 'list';
  emptyMessage?: string;
  className?: string;
  isActive?: boolean;
}

function TaskPanel({
  todos,
  year,
  month,
  selectedDate,
  pendingTodoId,
  onSelectDate,
  onAddTodo,
  onToggleTodo,
  onEditTodo,
  mode = 'date',
  emptyMessage,
  className = 'card p-4',
  isActive = true,
}: TaskPanelProps) {
  const weekRows = useMemo(() => buildTaskWeekRows(year, month), [year, month]);
  const weekScrollerRef = useRef<HTMLDivElement>(null);
  const isListMode = mode === 'list';
  const selectedWeekIndex = useMemo(
    () => getCalendarWeekIndexForDate(weekRows, selectedDate),
    [selectedDate, weekRows],
  );
  const visibleTodos = isListMode ? todos : getCalendarItemsForDate(todos, selectedDate);
  const counts = useMemo(() => {
    return todos.reduce<Record<string, number>>((acc, todo) => {
      acc[todo.date] = (acc[todo.date] ?? 0) + 1;
      return acc;
    }, {});
  }, [todos]);

  useEffect(() => {
    if (isListMode || !isActive) return;
    const frame = window.requestAnimationFrame(() => {
      const scroller = weekScrollerRef.current;
      if (!scroller) return;
      scroller.scrollTo({
        left: scroller.clientWidth * selectedWeekIndex,
        behavior: 'auto',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isActive, isListMode, selectedWeekIndex]);

  return (
    <section className={className}>
      {!isListMode && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ListTodo size={15} className="text-[var(--indigo-600)]" />
            <h3 className="text-[13px] font-bold text-[var(--foreground)]">할일</h3>
          </div>
          <button
            type="button"
            onClick={() => onAddTodo(selectedDate)}
            className="flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[12px] font-semibold text-[var(--indigo-700)] hover:bg-[var(--indigo-50)]"
            style={{ borderColor: 'var(--indigo-200)' }}
          >
            <Plus size={13} /> 할일 추가
          </button>
        </div>
      )}

      {!isListMode && (
        <div ref={weekScrollerRef} className="overflow-x-auto snap-x snap-mandatory pb-2">
          <div className="flex gap-3">
            {weekRows.map((week, weekIndex) => (
              <div key={weekIndex} className="grid min-w-full snap-start grid-cols-7 gap-1">
                {week.map(day => {
                  const isSelected = day.date === selectedDate;
                  const count = counts[day.date] ?? 0;
                  return (
                    <button
                      key={day.date}
                      type="button"
                      onClick={() => onSelectDate(day.date)}
                      className="min-h-[58px] rounded-lg border px-1 py-2 text-center transition-colors"
                      style={{
                        borderColor: isSelected ? 'var(--indigo-500)' : 'var(--line)',
                        background: isSelected ? 'var(--indigo-50)' : 'white',
                        color: day.inMonth ? 'var(--foreground)' : 'var(--stone-400)',
                      }}
                      aria-pressed={isSelected}
                    >
                      <span className="block text-[10px] font-semibold text-[var(--stone-500)]">
                        {DAYS[new Date(`${day.date}T00:00:00`).getDay()]}
                      </span>
                      <span className="block text-[14px] font-bold leading-tight">{day.day}</span>
                      <span
                        className="mx-auto mt-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold"
                        style={{
                          background: count > 0 ? 'var(--indigo-600)' : 'var(--stone-100)',
                          color: count > 0 ? 'white' : 'var(--stone-400)',
                        }}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={isListMode ? '' : 'mt-3 rounded-lg border bg-[var(--stone-50)] p-3'} style={isListMode ? undefined : { borderColor: 'var(--line)' }}>
        {!isListMode && (
          <div className="mb-2 flex items-center justify-between gap-2">
            <h4 className="text-[12px] font-bold text-[var(--foreground)]">{formatLongDate(selectedDate)}</h4>
            <span className="text-[11px] font-semibold text-[var(--muted)]">{visibleTodos.length}개</span>
          </div>
        )}
        {visibleTodos.length === 0 ? (
          <div className="rounded-lg border border-dashed bg-white px-3 py-6 text-center text-[12px] text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
            {emptyMessage ?? '선택한 날짜의 할일이 없습니다.'}
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTodos.map(todo => {
              const completed = Boolean(todo.completed);
              const colorStyle = TODO_COLOR_STYLE[todo.todoColor ?? 'lemon'];
              const Icon = completed ? CheckSquare2 : Square;
              return (
                <div
                  key={todo.id}
                  className="rounded-lg border px-3 py-2.5"
                  style={{
                    background: colorStyle.background,
                    borderColor: completed ? 'rgba(16,185,129,0.38)' : colorStyle.border,
                    borderLeftWidth: 4,
                    borderLeftColor: completed ? 'var(--success)' : colorStyle.accent,
                    opacity: pendingTodoId === todo.id ? 0.68 : 1,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleTodo(todo)}
                      disabled={pendingTodoId === todo.id}
                      className="mt-0.5 rounded p-0.5 text-[var(--stone-600)] hover:bg-white/55 disabled:opacity-60"
                      aria-label={completed ? `${todo.title} 미완료로 변경` : `${todo.title} 완료로 변경`}
                    >
                      <Icon
                        size={16}
                        className={completed ? 'text-[var(--success)]' : 'text-[var(--stone-500)]'}
                      />
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className={`text-[12px] font-semibold leading-snug ${completed ? 'text-[var(--stone-400)] line-through' : 'text-[var(--foreground)]'}`}>
                        {todo.title}
                      </div>
                      {todo.description && (
                        <p className={`mt-1 text-[11px] leading-snug ${completed ? 'text-[var(--stone-400)] line-through' : 'text-[var(--stone-600)]'}`}>
                          {todo.description}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-start gap-1">
                      <div className="flex flex-col items-end gap-1">
                        {isListMode && (
                          <span className="text-[10px] font-semibold text-[var(--muted)]">
                            {todo.date.replace(/-/g, '.')}
                          </span>
                        )}
                        {completed && <Badge variant="green">완료</Badge>}
                      </div>
                      <button
                        type="button"
                        onClick={() => onEditTodo(todo)}
                        className="rounded p-1 text-[var(--stone-500)] hover:bg-white/65 hover:text-[var(--foreground)]"
                        aria-label={`${todo.title} 편집`}
                      >
                        <Edit3 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default function CalendarClient({ initialYear, initialMonth, initialEvents, currentUserId }: CalendarClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [formMode, setFormMode] = useState<FormMode>('event');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => getInitialTaskDate(initialYear, initialMonth));
  const [mobileTab, setMobileTab] = useState<MobileTab>('calendar');
  const [desktopListTab, setDesktopListTab] = useState<DesktopListTab>('event');
  const [pendingTodoId, setPendingTodoId] = useState('');

  const fetchEvents = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const supabase = createClient();
    const { from, to } = getMonthDateRange(y, m);
    const { data, error: fetchError } = await supabase
      .from('work_calendar_events')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .eq('created_by', currentUserId)
      .order('date');
    if (fetchError) {
      console.error('calendar fetch failed', {
        code: fetchError.code,
        message: fetchError.message,
        details: fetchError.details,
        from,
        to,
      });
      setLoading(false);
      return;
    }
    setEvents((data ?? []).map((r: Record<string, unknown>) => calendarEventFromRow(r)));
    setLoading(false);
  }, [currentUserId]);

  function moveMonth(nextYear: number, nextMonth: number) {
    const nextSelectedDate = toDateKey(new Date(nextYear, nextMonth, 1));
    setMonth(nextMonth);
    setYear(nextYear);
    setSelectedDate(nextSelectedDate);
    fetchEvents(nextYear, nextMonth);
  }

  function prevMonth() {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    moveMonth(newYear, newMonth);
  }

  function nextMonth() {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    moveMonth(newYear, newMonth);
  }

  function selectCalendarDate(dateStr: string) {
    setSelectedDate(dateStr);
  }

  function selectMobileTab(tab: MobileTab) {
    if (tab === 'todo') {
      const today = new Date();
      const todayYear = today.getFullYear();
      const todayMonth = today.getMonth();
      setSelectedDate(toDateKey(today));
      if (todayYear !== year || todayMonth !== month) {
        setYear(todayYear);
        setMonth(todayMonth);
        fetchEvents(todayYear, todayMonth);
      }
    }
    setMobileTab(tab);
  }

  function openFormForDate(dateStr = selectedDate, mode: FormMode = 'event') {
    const nextDate = dateStr || selectedDate;
    setEditingEvent(null);
    setSelectedDate(nextDate);
    setFormMode(mode);
    setShowForm(true);
    setError('');
  }

  function openTodoForm(dateStr = selectedDate) {
    openFormForDate(dateStr, 'todo');
  }

  function openFormForItem(item: CalendarEvent) {
    setEditingEvent(item);
    setSelectedDate(item.date);
    setFormMode(item.type === 'todo' ? 'todo' : 'event');
    setShowForm(true);
    setError('');
  }

  async function refreshCalendarForDate(dateStr: string) {
    const nextDate = new Date(`${dateStr}T00:00:00`);
    const nextYear = nextDate.getFullYear();
    const nextMonth = nextDate.getMonth();
    setSelectedDate(dateStr);
    if (nextYear !== year || nextMonth !== month) {
      setYear(nextYear);
      setMonth(nextMonth);
      await fetchEvents(nextYear, nextMonth);
      return;
    }
    await fetchEvents(year, month);
  }

  async function handleToggleTodo(todo: CalendarEvent) {
    if (pendingTodoId) return;
    setPendingTodoId(todo.id);
    const result = await updateTodoCompletion(todo.id, !todo.completed);
    if (result.success) {
      await fetchEvents(year, month);
    } else {
      setError(result.error ?? '할일 상태 저장 중 오류가 발생했습니다.');
    }
    setPendingTodoId('');
  }

  async function handleSaveEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const savedDate = (formData.get('date') as string ?? '').trim();
    const savedType = formData.get('type');
    const result = editingEvent ? await updateEvent(formData) : await createEvent(formData);
    setSubmitting(false);
    if (result.success) {
      setShowForm(false);
      setEditingEvent(null);
      if (savedType === 'todo') {
        setMobileTab('todo');
      }
      await refreshCalendarForDate(savedDate || selectedDate);
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  }

  async function handleDeleteCalendarItem() {
    if (!editingEvent) return;
    const confirmed = window.confirm(`"${editingEvent.title}" 항목을 삭제할까요?\n삭제된 항목은 복구할 수 없습니다.`);
    if (!confirmed) return;

    setDeleting(true);
    setError('');
    const result = await deleteEvent(editingEvent.id);
    setDeleting(false);
    if (result.success) {
      setShowForm(false);
      setEditingEvent(null);
      await fetchEvents(year, month);
    } else {
      setError(result.error ?? '삭제 중 오류가 발생했습니다.');
    }
  }

  const cells = buildCalendar(year, month);
  const { events: scheduleEvents, todos } = useMemo(() => splitCalendarItems(events), [events]);
  const sortedEvents = [...scheduleEvents].sort((a, b) => a.date.localeCompare(b.date));
  const sortedTodos = [...todos].sort((a, b) => {
    const byDate = a.date.localeCompare(b.date);
    if (byDate !== 0) return byDate;
    return a.title.localeCompare(b.title);
  });
  const selectedDayEvents = getCalendarItemsForDate(sortedEvents, selectedDate);
  const selectedDayTodos = getCalendarItemsForDate(sortedTodos, selectedDate);
  const visibleListEvents = selectedDayEvents;
  const visibleListTodos = selectedDayTodos;
  const mobileCalendarSections = getMobileCalendarSectionKeys();
  const desktopListSections = getCalendarListSectionKeys();
  const listDateLabel = formatLongDate(selectedDate);
  const todayDate = new Date();
  const today =
    todayDate.getFullYear() === year && todayDate.getMonth() === month
      ? todayDate.getDate()
      : -1;
  const isTodoForm = formMode === 'todo';
  const formDateValue = editingEvent?.date ?? selectedDate;

  return (
    <>
      <div className="mb-3 grid grid-cols-2 rounded-lg border bg-white p-1 md:hidden" style={{ borderColor: 'var(--line)' }}>
        {([
          ['calendar', '일정', CalendarDays],
          ['todo', '할일', ListTodo],
        ] as Array<[MobileTab, string, React.ElementType]>).map(([tab, label, Icon]) => (
          <button
            key={tab}
            type="button"
            data-calendar-mobile-tab={tab}
            onClick={() => selectMobileTab(tab)}
            className="flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-semibold"
            style={{
              background: mobileTab === tab ? 'var(--indigo-600)' : 'transparent',
              color: mobileTab === tab ? 'white' : 'var(--stone-600)',
            }}
            aria-pressed={mobileTab === tab}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className={`${mobileTab === 'calendar' ? 'block' : 'hidden'} md:block`}>
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          <div className="card p-5 xl:col-span-2">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="rounded p-1 hover:bg-[var(--stone-100)] transition-colors"
                  aria-label="이전 달"
                >
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-[15px] font-bold text-[var(--foreground)]">
                  {year}년 {month + 1}월
                </h2>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="rounded p-1 hover:bg-[var(--stone-100)] transition-colors"
                  aria-label="다음 달"
                >
                  <ChevronRight size={16} />
                </button>
                {loading && (
                  <span className="text-[11px] text-[var(--muted)]">로딩 중...</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openTodoForm(selectedDate)}
                  className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold text-[var(--indigo-700)] hover:bg-[var(--indigo-50)]"
                  style={{ borderColor: 'var(--indigo-200)' }}
                >
                  <Plus size={13} /> 할일 추가
                </button>
                <button
                  type="button"
                  onClick={() => openFormForDate(selectedDate, 'event')}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold text-white"
                  style={{ background: 'var(--indigo-600)' }}
                >
                  <Plus size={13} /> 일정 추가
                </button>
              </div>
            </div>

            <div className="mb-2 grid grid-cols-7">
              {DAYS.map(d => (
                <div
                  key={d}
                  className="py-1 text-center text-[11px] font-semibold text-[var(--muted)]"
                >
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-px bg-[var(--line)]">
              {cells.map((day, i) => {
                const dateStr = day
                  ? `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  : '';
                const dayEvents = getCalendarItemsForDate(scheduleEvents, dateStr);
                const dayTodos = getCalendarItemsForDate(todos, dateStr);
                const isToday = day === today;
                const isSelected = dateStr === selectedDate;
                return (
                  <div
                    key={i}
                    onClick={() => day && selectCalendarDate(dateStr)}
                    className={`min-h-[56px] bg-white p-1.5 sm:min-h-[80px] ${
                      day ? 'cursor-pointer hover:bg-[var(--stone-50)]' : 'opacity-30'
                    } ${isSelected ? 'ring-2 ring-inset ring-[var(--indigo-500)]' : ''}`}
                  >
                    {day && (
                      <>
                        <div
                          className={`mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold ${
                            isToday
                              ? 'bg-[var(--indigo-600)] text-white'
                              : 'text-[var(--stone-700)]'
                          }`}
                        >
                          {day}
                        </div>
                        {dayEvents.slice(0, 2).map(event => (
                          <div
                            key={event.id}
                            className={`mb-0.5 truncate rounded px-1 py-0.5 text-[9px] font-medium ${TYPE_BG[event.type]}`}
                          >
                            {event.title}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-[9px] text-[var(--muted)]">
                            +{dayEvents.length - 2}개
                          </div>
                        )}
                        {dayTodos.length > 0 && (
                          <div className="mt-1 hidden h-[18px] items-center justify-between rounded bg-[var(--stone-100)] px-1.5 text-[9px] font-bold text-[var(--stone-600)] md:flex">
                            <span>할일</span>
                            <span>{dayTodos.length}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <section className="space-y-4 md:hidden">
              {mobileCalendarSections.map(section => (
                section === 'event' ? (
                  <div key="event">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-bold text-[var(--foreground)]">
                        {listDateLabel} 일정
                      </h3>
                      <span className="text-[11px] font-semibold text-[var(--muted)]">{visibleListEvents.length}개</span>
                    </div>
                    {visibleListEvents.length === 0 ? (
                      <div className="card p-8 text-center text-[12px] text-[var(--muted)]">
                        선택한 날짜의 일정이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {visibleListEvents.map(event => (
                          <div key={event.id} className="card p-4">
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--foreground)]">
                                {event.title}
                              </span>
                              <div className="flex shrink-0 items-center gap-1">
                                <Badge variant={TYPE_VARIANT[event.type]}>{TYPE_LABEL[event.type]}</Badge>
                                <button
                                  type="button"
                                  onClick={() => openFormForItem(event)}
                                  className="rounded p-1 text-[var(--stone-500)] hover:bg-[var(--stone-100)] hover:text-[var(--foreground)]"
                                  aria-label={`${event.title} 편집`}
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            </div>
                            <div className="text-[11px] text-[var(--muted)]">
                              {event.date.replace(/-/g, '.')}
                            </div>
                            {event.description && (
                              <div className="mt-1 text-[11px] text-[var(--stone-600)]">
                                {event.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div key="todo">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h3 className="text-[13px] font-bold text-[var(--foreground)]">
                        {listDateLabel} 할일
                      </h3>
                      <span className="text-[11px] font-semibold text-[var(--muted)]">{visibleListTodos.length}개</span>
                    </div>
                    <TaskPanel
                      todos={visibleListTodos}
                      year={year}
                      month={month}
                      selectedDate={selectedDate}
                      pendingTodoId={pendingTodoId}
                      onSelectDate={selectCalendarDate}
                      onAddTodo={openTodoForm}
                      onToggleTodo={handleToggleTodo}
                      onEditTodo={openFormForItem}
                      mode="list"
                      emptyMessage="선택한 날짜의 할일이 없습니다."
                      className=""
                    />
                  </div>
                )
              ))}
            </section>

            <section className="card hidden min-h-[520px] max-h-[calc(100vh-190px)] min-w-0 flex-col p-4 md:flex">
              <div className="mb-3 grid grid-cols-2 rounded-lg border bg-white p-1" style={{ borderColor: 'var(--line)' }}>
                {desktopListSections.map(section => {
                  const active = desktopListTab === section;
                  const Icon = section === 'event' ? CalendarDays : ListTodo;
                  const label = section === 'event' ? '일정' : '할일';
                  const count = section === 'event' ? visibleListEvents.length : visibleListTodos.length;

                  return (
                    <button
                      key={section}
                      type="button"
                      data-calendar-desktop-tab={section}
                      onClick={() => setDesktopListTab(section)}
                      className="flex min-w-0 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-[12px] font-semibold"
                      style={{
                        background: active ? 'var(--indigo-600)' : 'transparent',
                        color: active ? 'white' : 'var(--stone-600)',
                      }}
                      aria-pressed={active}
                    >
                      <Icon size={14} />
                      <span>{label}</span>
                      <span className="text-[10px] opacity-80">{count}</span>
                    </button>
                  );
                })}
              </div>

              {desktopListTab === 'event' && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <CalendarDays size={15} className="shrink-0 text-[var(--indigo-600)]" />
                      <h3 className="truncate text-[13px] font-bold text-[var(--foreground)]">
                        {listDateLabel} 일정
                      </h3>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-[var(--muted)]">{visibleListEvents.length}개</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    {visibleListEvents.length === 0 ? (
                      <div className="rounded-lg border border-dashed bg-white px-3 py-8 text-center text-[12px] text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
                        선택한 날짜의 일정이 없습니다.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {visibleListEvents.map(event => (
                          <div key={event.id} className="rounded-lg border bg-white px-3 py-2.5" style={{ borderColor: 'var(--line)' }}>
                            <div className="mb-1 flex items-start justify-between gap-2">
                              <span className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--foreground)]">
                                {event.title}
                              </span>
                              <div className="flex shrink-0 items-center gap-1">
                                <Badge variant={TYPE_VARIANT[event.type]}>{TYPE_LABEL[event.type]}</Badge>
                                <button
                                  type="button"
                                  onClick={() => openFormForItem(event)}
                                  className="rounded p-1 text-[var(--stone-500)] hover:bg-[var(--stone-100)] hover:text-[var(--foreground)]"
                                  aria-label={`${event.title} 편집`}
                                >
                                  <Edit3 size={13} />
                                </button>
                              </div>
                            </div>
                            <div className="text-[11px] text-[var(--muted)]">
                              {event.date.replace(/-/g, '.')}
                            </div>
                            {event.description && (
                              <div className="mt-1 text-[11px] text-[var(--stone-600)]">
                                {event.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {desktopListTab === 'todo' && (
                <div className="flex min-h-0 flex-1 flex-col">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <ListTodo size={15} className="shrink-0 text-[var(--indigo-600)]" />
                      <h3 className="truncate text-[13px] font-bold text-[var(--foreground)]">
                        {listDateLabel} 할일
                      </h3>
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold text-[var(--muted)]">{visibleListTodos.length}개</span>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                    <TaskPanel
                      todos={visibleListTodos}
                      year={year}
                      month={month}
                      selectedDate={selectedDate}
                      pendingTodoId={pendingTodoId}
                      onSelectDate={selectCalendarDate}
                      onAddTodo={openTodoForm}
                      onToggleTodo={handleToggleTodo}
                      onEditTodo={openFormForItem}
                      mode="list"
                      emptyMessage="선택한 날짜의 할일이 없습니다."
                      className=""
                    />
                  </div>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>

      <div className={`${mobileTab === 'todo' ? 'block' : 'hidden'} md:hidden`}>
        <TaskPanel
          todos={todos}
          year={year}
          month={month}
          selectedDate={selectedDate}
          pendingTodoId={pendingTodoId}
          onSelectDate={selectCalendarDate}
          onAddTodo={openTodoForm}
          onToggleTodo={handleToggleTodo}
          onEditTodo={openFormForItem}
          isActive={mobileTab === 'todo'}
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-[92vw] max-w-md rounded-2xl bg-white shadow-2xl">
            <div
              className="flex items-center justify-between border-b px-4 py-4 sm:px-6"
              style={{ borderColor: 'var(--line)' }}
            >
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">
                {editingEvent
                  ? (isTodoForm ? '할일 편집' : '일정 편집')
                  : (isTodoForm ? '할일 추가' : '일정 추가')}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingEvent(null);
                  setError('');
                }}
                className="rounded-lg p-1.5 hover:bg-[var(--stone-100)]"
                aria-label="닫기"
              >
                <X size={16} className="text-[var(--muted)]" />
              </button>
            </div>
            <form onSubmit={handleSaveEvent} className="space-y-4 p-6">
              {editingEvent && <input type="hidden" name="id" value={editingEvent.id} />}
              {isTodoForm && <input type="hidden" name="type" value="todo" />}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">
                  {isTodoForm ? '할일 *' : '제목 *'}
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  defaultValue={editingEvent?.title ?? ''}
                  placeholder={isTodoForm ? '할일을 입력하세요' : '일정 제목'}
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">
                  날짜 *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={formDateValue}
                  className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              {isTodoForm && (
                <div>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">
                    색상
                  </label>
                  <div className="flex items-center gap-2">
                    {TODO_COLORS.map(color => {
                      const style = TODO_COLOR_STYLE[color];
                      return (
                        <label
                          key={color}
                          className="h-7 w-7 cursor-pointer rounded-md border has-[:checked]:ring-2 has-[:checked]:ring-[var(--indigo-500)] has-[:checked]:ring-offset-2"
                          style={{ borderColor: style.border, background: style.background }}
                          aria-label={`${style.label} 색상`}
                          title={`${style.label} 색상`}
                        >
                          <input
                            type="radio"
                            name="todoColor"
                            value={color}
                            defaultChecked={color === (editingEvent?.todoColor ?? 'lemon')}
                            className="sr-only"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              {!isTodoForm && (
                <>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">
                      종류
                    </label>
                    <select
                      name="type"
                      defaultValue={editingEvent && editingEvent.type !== 'todo' ? editingEvent.type : 'meeting'}
                      className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)]"
                      style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                    >
                      <option value="meeting">미팅</option>
                      <option value="deadline">마감</option>
                      <option value="holiday">휴일</option>
                      <option value="personal">개인</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="allDay"
                      id="allDay"
                      defaultChecked={editingEvent?.allDay ?? false}
                      className="h-4 w-4 rounded accent-[var(--indigo-600)]"
                    />
                    <label
                      htmlFor="allDay"
                      className="cursor-pointer text-[13px] text-[var(--foreground)]"
                    >
                      하루 종일
                    </label>
                  </div>
                </>
              )}
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-[var(--stone-600)]">
                  {isTodoForm ? '메모' : '설명'}
                </label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingEvent?.description ?? ''}
                  placeholder={isTodoForm ? '할일 메모 (선택)' : '일정 설명 (선택)'}
                  className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-[#fee2e2] px-3 py-2 text-[12px] text-[var(--danger)]">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="flex flex-col gap-2 pt-2 sm:flex-row">
                {editingEvent && (
                  <button
                    type="button"
                    onClick={() => void handleDeleteCalendarItem()}
                    disabled={submitting || deleting}
                    className="flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-[13px] font-semibold text-[var(--danger)] hover:bg-[#fee2e2] disabled:opacity-60"
                    style={{ borderColor: '#fecaca' }}
                  >
                    <Trash2 size={14} /> {deleting ? '삭제 중...' : '삭제'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingEvent(null);
                    setError('');
                  }}
                  disabled={submitting || deleting}
                  className="flex-1 rounded-lg border py-2.5 text-[13px] font-medium hover:bg-[var(--stone-50)] transition-colors disabled:opacity-60"
                  style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting || deleting}
                  className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
                  style={{ background: 'var(--indigo-600)' }}
                >
                  {submitting ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
