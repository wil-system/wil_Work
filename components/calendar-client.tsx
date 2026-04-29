'use client';
import { useState, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, X, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { createEvent } from '@/app/(workspace)/calendar/actions';
import type { CalendarEvent } from '@/lib/types';

const DAYS = ['일', '월', '화', '수', '목', '금', '토'];
const TYPE_VARIANT: Record<string, 'indigo' | 'green' | 'yellow' | 'red'> = {
  meeting: 'indigo', deadline: 'red', holiday: 'yellow', personal: 'green',
};
const TYPE_LABEL: Record<string, string> = {
  meeting: '미팅', deadline: '마감', holiday: '휴일', personal: '개인',
};
const TYPE_BG: Record<string, string> = {
  meeting: 'bg-[var(--indigo-50)] text-[var(--indigo-700)]',
  deadline: 'bg-[#fee2e2] text-[#991b1b]',
  holiday: 'bg-[#fef9c3] text-[#92400e]',
  personal: 'bg-[#d1fae5] text-[#065f46]',
};

function buildCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface CalendarClientProps {
  initialYear: number;
  initialMonth: number;
  initialEvents: CalendarEvent[];
}

export default function CalendarClient({ initialYear, initialMonth, initialEvents }: CalendarClientProps) {
  const [year, setYear] = useState(initialYear);
  const [month, setMonth] = useState(initialMonth);
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  const fetchEvents = useCallback(async (y: number, m: number) => {
    setLoading(true);
    const supabase = createClient();
    const from = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m + 1, 0).getDate();
    const to = `${y}-${String(m + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const { data, error: fetchError } = await supabase
      .from('work_calendar_events')
      .select('*')
      .gte('date', from)
      .lte('date', to)
      .order('date');
    if (fetchError) {
      setLoading(false);
      return;
    }
    setEvents((data ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      title: r.title as string,
      date: r.date as string,
      endDate: r.end_date as string | undefined,
      allDay: r.all_day as boolean,
      type: r.type as CalendarEvent['type'],
      attendees: r.attendees as string[],
      description: r.description as string | undefined,
    })));
    setLoading(false);
  }, []);

  function prevMonth() {
    const newMonth = month === 0 ? 11 : month - 1;
    const newYear = month === 0 ? year - 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    fetchEvents(newYear, newMonth);
  }

  function nextMonth() {
    const newMonth = month === 11 ? 0 : month + 1;
    const newYear = month === 11 ? year + 1 : year;
    setMonth(newMonth);
    setYear(newYear);
    fetchEvents(newYear, newMonth);
  }

  function openFormForDate(dateStr: string) {
    setSelectedDate(dateStr);
    setShowForm(true);
  }

  async function handleCreateEvent(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const result = await createEvent(formData);
    setSubmitting(false);
    if (result.success) {
      setShowForm(false);
      setSelectedDate('');
      await fetchEvents(year, month);
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  }

  const cells = buildCalendar(year, month);
  const sorted = [...events].sort((a, b) => a.date.localeCompare(b.date));
  const todayDate = new Date();
  const today =
    todayDate.getFullYear() === year && todayDate.getMonth() === month
      ? todayDate.getDate()
      : -1;

  return (
    <>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Calendar grid */}
        <div className="xl:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1 rounded hover:bg-[var(--stone-100)] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">
                {year}년 {month + 1}월
              </h2>
              <button
                onClick={nextMonth}
                className="p-1 rounded hover:bg-[var(--stone-100)] transition-colors"
              >
                <ChevronRight size={16} />
              </button>
              {loading && (
                <span className="text-[11px] text-[var(--muted)]">로딩 중...</span>
              )}
            </div>
            <button
              onClick={() => {
                setSelectedDate('');
                setShowForm(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white"
              style={{ background: 'var(--indigo-600)' }}
            >
              <Plus size={13} /> 일정 추가
            </button>
          </div>

          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div
                key={d}
                className="text-center text-[11px] font-semibold text-[var(--muted)] py-1"
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
              const dayEvents = events.filter(e => e.date === dateStr);
              const isToday = day === today;
              return (
                <div
                  key={i}
                  onClick={() => day && openFormForDate(dateStr)}
                  className={`bg-white min-h-[56px] sm:min-h-[80px] p-1.5 ${
                    day ? 'cursor-pointer hover:bg-[var(--stone-50)]' : 'opacity-30'
                  }`}
                >
                  {day && (
                    <>
                      <div
                        className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold mb-1 ${
                          isToday
                            ? 'bg-[var(--indigo-600)] text-white'
                            : 'text-[var(--stone-700)]'
                        }`}
                      >
                        {day}
                      </div>
                      {dayEvents.slice(0, 2).map(e => (
                        <div
                          key={e.id}
                          className={`text-[9px] font-medium px-1 py-0.5 rounded mb-0.5 truncate ${TYPE_BG[e.type]}`}
                        >
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 2 && (
                        <div className="text-[9px] text-[var(--muted)]">
                          +{dayEvents.length - 2}개
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming events sidebar */}
        <div className="space-y-3">
          <h3 className="text-[13px] font-bold text-[var(--foreground)]">다가오는 일정</h3>
          {sorted.length === 0 ? (
            <div className="card p-8 text-center text-[var(--muted)] text-[12px]">
              이번 달 일정이 없습니다.
            </div>
          ) : (
            sorted.map(event => (
              <div key={event.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[var(--foreground)]">
                    {event.title}
                  </span>
                  <Badge variant={TYPE_VARIANT[event.type]}>{TYPE_LABEL[event.type]}</Badge>
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  {event.date.replace(/-/g, '.')}
                </div>
                {event.description && (
                  <div className="text-[11px] text-[var(--stone-600)] mt-1">
                    {event.description}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Add event modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-[92vw] max-w-md bg-white rounded-2xl shadow-2xl">
            <div
              className="flex items-center justify-between px-4 sm:px-6 py-4 border-b"
              style={{ borderColor: 'var(--line)' }}
            >
              <h2 className="text-[15px] font-bold text-[var(--foreground)]">일정 추가</h2>
              <button
                onClick={() => {
                  setShowForm(false);
                  setError('');
                }}
                className="p-1.5 rounded-lg hover:bg-[var(--stone-100)]"
              >
                <X size={16} className="text-[var(--muted)]" />
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">
                  제목 *
                </label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="일정 제목"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">
                  날짜 *
                </label>
                <input
                  type="date"
                  name="date"
                  required
                  defaultValue={selectedDate}
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">
                  종류
                </label>
                <select
                  name="type"
                  defaultValue="meeting"
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                >
                  <option value="meeting">미팅</option>
                  <option value="deadline">마감</option>
                  <option value="holiday">휴일</option>
                  <option value="personal">개인</option>
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">
                  설명
                </label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="일정 설명 (선택)"
                  className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allDay"
                  id="allDay"
                  className="w-4 h-4 rounded accent-[var(--indigo-600)]"
                />
                <label
                  htmlFor="allDay"
                  className="text-[13px] text-[var(--foreground)] cursor-pointer"
                >
                  하루 종일
                </label>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
                  <AlertCircle size={13} /> {error}
                </div>
              )}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setError('');
                  }}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border hover:bg-[var(--stone-50)] transition-colors"
                  style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
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
