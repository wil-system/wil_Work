import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { mockCalendarEvents } from '@/lib/mock-data';

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

export default function CalendarPage() {
  const year = 2026, month = 3;
  const cells = buildCalendar(year, month);
  const sorted = [...mockCalendarEvents].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="캘린더" subtitle="일정을 관리하세요" />
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

          {/* Calendar grid */}
          <div className="xl:col-span-2 card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <button className="p-1 rounded hover:bg-[var(--stone-100)] transition-colors"><ChevronLeft size={16} /></button>
                <h2 className="text-[15px] font-bold text-[var(--foreground)]">2026년 4월</h2>
                <button className="p-1 rounded hover:bg-[var(--stone-100)] transition-colors"><ChevronRight size={16} /></button>
              </div>
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white" style={{ background: 'var(--indigo-600)' }}>
                <Plus size={13} /> 일정 추가
              </button>
            </div>
            <div className="grid grid-cols-7 mb-2">
              {DAYS.map(d => (
                <div key={d} className="text-center text-[11px] font-semibold text-[var(--muted)] py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-[var(--line)]">
              {cells.map((day, i) => {
                const dateStr = day ? `2026-04-${String(day).padStart(2, '0')}` : '';
                const events = mockCalendarEvents.filter(e => e.date === dateStr);
                const isToday = day === 28;
                return (
                  <div key={i} className={`bg-white min-h-[72px] p-1.5 ${day ? 'cursor-pointer hover:bg-[var(--stone-50)]' : 'opacity-30'}`}>
                    {day && (
                      <>
                        <div className={`w-6 h-6 flex items-center justify-center rounded-full text-[12px] font-semibold mb-1 ${isToday ? 'bg-[var(--indigo-600)] text-white' : 'text-[var(--stone-700)]'}`}>
                          {day}
                        </div>
                        {events.slice(0, 2).map(e => (
                          <div key={e.id} className={`text-[9px] font-medium px-1 py-0.5 rounded mb-0.5 truncate ${TYPE_BG[e.type]}`}>
                            {e.title}
                          </div>
                        ))}
                        {events.length > 2 && <div className="text-[9px] text-[var(--muted)]">+{events.length - 2}개</div>}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming events */}
          <div className="space-y-3">
            <h3 className="text-[13px] font-bold text-[var(--foreground)]">다가오는 일정</h3>
            {sorted.map(event => (
              <div key={event.id} className="card p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-[13px] font-semibold text-[var(--foreground)]">{event.title}</span>
                  <Badge variant={TYPE_VARIANT[event.type]}>{TYPE_LABEL[event.type]}</Badge>
                </div>
                <div className="text-[11px] text-[var(--muted)]">{event.date.replace(/-/g, '.')}</div>
                {event.description && <div className="text-[11px] text-[var(--stone-600)] mt-1">{event.description}</div>}
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
