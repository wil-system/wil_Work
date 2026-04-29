import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { getTodayReports } from '@/lib/db/reports';
import { getCurrentProfile, getAllProfiles } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import type { WorkReport } from '@/lib/types';
import WorkReportForm from '@/components/work-report-form';

const STATUS_MAP: Record<WorkReport['status'], { label: string; variant: 'gray' | 'indigo' | 'green' }> = {
  draft:     { label: '임시저장', variant: 'gray' },
  submitted: { label: '제출완료', variant: 'indigo' },
  reviewed:  { label: '검토완료', variant: 'green' },
};

export default async function WorkReportPage() {
  const [reports, user, allProfiles, unreadCount] = await Promise.all([
    getTodayReports(),
    getCurrentProfile(),
    getAllProfiles(),
    getUnreadNotificationCount(),
  ]);

  if (!user) redirect('/login');

  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\. /g, '.').replace('.', '');
  const profileMap = Object.fromEntries(allProfiles.map(p => [p.id, p]));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="업무보고" subtitle="일일 업무 현황을 기록하고 공유하세요" currentUser={user} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

          <div className="xl:col-span-1">
            <WorkReportForm />
          </div>

          <div className="xl:col-span-2 space-y-4">
            <h2 className="text-[14px] font-bold text-[var(--foreground)]">팀원 업무보고 — {today}</h2>
            {reports.length === 0 ? (
              <div className="card p-12 text-center text-[var(--muted)] text-[13px]">오늘 제출된 업무보고가 없습니다.</div>
            ) : reports.map(report => {
              const author = profileMap[report.authorId];
              if (!author) return null;
              const status = STATUS_MAP[report.status];
              const pending = report.plannedTasks.filter(t => !report.completedTasks.includes(t));
              return (
                <div key={report.id} className="card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initial={author.avatarInitial} color={author.avatarColor} size="md" />
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">{author.name}</div>
                        <div className="text-[11px] text-[var(--muted)]">{author.position}</div>
                      </div>
                    </div>
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    {report.completedTasks.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--stone-700)]">
                        <CheckCircle2 size={13} className="text-[var(--success)] mt-0.5 flex-shrink-0" />
                        {t}
                      </div>
                    ))}
                    {pending.map((t, i) => (
                      <div key={i} className="flex items-start gap-2 text-[12px] text-[var(--muted)]">
                        <Circle size={13} className="mt-0.5 flex-shrink-0" />
                        {t}
                      </div>
                    ))}
                  </div>
                  {report.issues && (
                    <div className="flex items-start gap-2 mt-3 px-3 py-2 rounded-lg bg-[var(--stone-100)] text-[12px] text-[var(--stone-700)]">
                      <AlertCircle size={13} className="text-[var(--warning)] mt-0.5 flex-shrink-0" />
                      {report.issues}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
