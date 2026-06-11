import Link from 'next/link';
import { redirect } from 'next/navigation';
import PaginationNav from '@/components/pagination-nav';
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import WorkReportReviewSubmitButton from '@/components/work-report-review-submit-button';
import { getAllBoardPermissions } from '@/lib/db/boards';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import { getReportById, getReportPage } from '@/lib/db/reports';
import { getTotalPages, parsePageParam } from '@/lib/pagination';
import {
  canReviewWorkReport,
  canSubmitReviewDecision,
  getReportAuthorLevel,
  REPORT_ACTOR_LABEL,
} from '@/lib/report-review-permissions';
import { getWorkReportDepartmentLabel } from '@/lib/work-report-departments';
import type { Profile, ReportReviewStatus, WorkReport } from '@/lib/types';
import { reviewReportAction } from '../actions';

const PAGE_SIZE = 15;
const REVIEW_STATUSES: ReportReviewStatus[] = ['submitted', 'changes_requested', 'reviewed'];

const REVIEW_LABEL: Record<ReportReviewStatus, string> = {
  draft: '미제출',
  submitted: '검토대기',
  reviewed: '검토완료',
  changes_requested: '수정요청',
};

const REVIEW_VARIANT: Record<ReportReviewStatus, 'gray' | 'indigo' | 'green' | 'yellow'> = {
  draft: 'gray',
  submitted: 'indigo',
  reviewed: 'green',
  changes_requested: 'yellow',
};

const STATUS_ACCENT: Record<ReportReviewStatus, string> = {
  draft: '#d6d3d1',
  submitted: '#4f46e5',
  reviewed: '#059669',
  changes_requested: '#d97706',
};

async function reviewReportFormAction(formData: FormData) {
  'use server';
  await reviewReportAction(formData);
}

function localDateOffset(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
}

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function isReviewStatus(value: string | undefined): value is ReportReviewStatus {
  return value === 'submitted' || value === 'reviewed' || value === 'changes_requested';
}

function formatDateRange(report: WorkReport) {
  return `${report.periodStart.replace(/-/g, '.')} - ${report.periodEnd.replace(/-/g, '.')}`;
}

function buildReviewHref(
  current: Record<string, string>,
  overrides: Record<string, string | number | undefined>,
) {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined || value === '') params.delete(key);
    else params.set(key, String(value));
  }
  const query = params.toString();
  return query ? `/work-report/review?${query}` : '/work-report/review';
}

function ReportItems({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-semibold text-[var(--muted)]">{title}</div>
      {items.length === 0 ? (
        <div className="text-[12px] text-[var(--stone-400)]">입력 없음</div>
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item} className="text-[12px] leading-relaxed text-[var(--stone-700)]">- {item}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReviewForm({ report }: { report: WorkReport }) {
  return (
    <form action={reviewReportFormAction} className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-[var(--stone-50)] p-3 sm:grid-cols-[140px_1fr_auto]">
      <input type="hidden" name="reportId" value={report.id} />
      <select
        name="reviewStatus"
        defaultValue="reviewed"
        className="rounded-lg border px-2.5 py-2 text-[12px] outline-none focus:border-[var(--indigo-500)]"
        style={{ borderColor: 'var(--line)', background: 'white' }}
      >
        <option value="reviewed">검토완료</option>
        <option value="changes_requested">수정요청</option>
      </select>
      <input
        name="reviewComment"
        defaultValue={report.reviewComment ?? ''}
        placeholder="검토 코멘트"
        className="rounded-lg border px-2.5 py-2 text-[12px] outline-none focus:border-[var(--indigo-500)]"
        style={{ borderColor: 'var(--line)', background: 'white' }}
      />
      <WorkReportReviewSubmitButton />
    </form>
  );
}

function ReviewActionStatus({ status }: { status: ReportReviewStatus }) {
  const message = status === 'reviewed'
    ? '검토완료 처리되었습니다.'
    : status === 'changes_requested'
      ? '수정요청을 보냈습니다. 작성자가 다시 제출하면 검토할 수 있습니다.'
      : '아직 검토할 수 없는 상태입니다.';

  return (
    <div className="mt-3 rounded-lg bg-[var(--stone-50)] px-3 py-2 text-[12px] text-[var(--stone-600)]">
      {message}
    </div>
  );
}

function ReviewReportRow({
  report,
  author,
  authorLevel,
  reviewer,
  canReview,
  defaultOpen,
}: {
  report: WorkReport;
  author?: Profile;
  authorLevel: 'member' | 'leader' | 'admin';
  reviewer?: Profile;
  canReview: boolean;
  defaultOpen?: boolean;
}) {
  const canSubmitReview = canReview && canSubmitReviewDecision(report);

  return (
    <details
      open={defaultOpen}
      className="group rounded-lg border bg-white"
      style={{ borderColor: 'var(--line)', borderLeft: `4px solid ${STATUS_ACCENT[report.reviewStatus]}` }}
    >
      <summary className="grid cursor-pointer list-none grid-cols-1 gap-2 px-3 py-2.5 text-[12px] transition-colors hover:bg-[var(--stone-50)] md:grid-cols-[150px_1fr_110px_74px] md:items-center [&::-webkit-details-marker]:hidden">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="gray">{getWorkReportDepartmentLabel(report.department, author?.department)}</Badge>
          <Badge variant={authorLevel === 'admin' ? 'indigo' : authorLevel === 'leader' ? 'yellow' : 'gray'}>
            {REPORT_ACTOR_LABEL[authorLevel]}
          </Badge>
          <Badge variant={REVIEW_VARIANT[report.reviewStatus]}>{REVIEW_LABEL[report.reviewStatus]}</Badge>
        </div>
        <div className="min-w-0">
          <div className="truncate font-semibold text-[var(--foreground)]">{report.periodLabel}</div>
          <div className="mt-0.5 truncate text-[10px] text-[var(--muted)]">{formatDateRange(report)}</div>
        </div>
        <div className="truncate text-[11px] font-semibold text-[var(--stone-700)]">{author?.name ?? '알 수 없음'}</div>
        <div className="text-right text-[11px] font-semibold text-[var(--indigo-600)]">
          <span className="group-open:hidden">펼치기</span>
          <span className="hidden group-open:inline">접기</span>
        </div>
      </summary>

      <div className="border-t px-4 py-4" style={{ borderColor: 'var(--line)' }}>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <ReportItems title="목표" items={report.goals} />
          <ReportItems title="진행업무" items={report.progress} />
          <div>
            <div className="mb-1 text-[11px] font-semibold text-[var(--muted)]">이슈사항</div>
            <div className="whitespace-pre-line text-[12px] leading-relaxed text-[var(--stone-700)]">
              {report.issues || '입력 없음'}
            </div>
          </div>
          <ReportItems title="다음계획" items={report.nextPlan} />
        </div>

        {(report.reviewComment || reviewer) && (
          <div className="mt-3 rounded-lg bg-[var(--indigo-50)] px-3 py-2 text-[12px] text-[var(--stone-700)]">
            <span className="font-semibold text-[var(--indigo-700)]">{reviewer?.name ?? '검토자'}</span>
            {report.reviewComment ? ` · ${report.reviewComment}` : ' · 검토 상태가 저장되었습니다.'}
          </div>
        )}

        {canSubmitReview && <ReviewForm report={report} />}
        {canReview && !canSubmitReview && <ReviewActionStatus status={report.reviewStatus} />}
        {!canReview && (
          <div className="mt-3 rounded-lg bg-[var(--stone-50)] px-3 py-2 text-[12px] text-[var(--stone-600)]">
            수신자로 지정된 사용자만 검토할 수 있습니다.
          </div>
        )}
      </div>
    </details>
  );
}

export default async function WorkReportReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentProfile();
  if (!user) redirect('/login');

  const from = one(params.from) || localDateOffset(-30);
  const to = one(params.to) || localDateOffset(0);
  const selectedReportId = one(params.report) || '';
  const authorId = one(params.authorId) || '';
  const statusParam = one(params.status);
  const reviewStatus = isReviewStatus(statusParam) ? statusParam : undefined;
  const page = parsePageParam(one(params.page));

  const [allProfiles, permissions, unreadCount, selectedReportCandidate] = await Promise.all([
    getAllProfiles(),
    getAllBoardPermissions(),
    getUnreadNotificationCount(),
    selectedReportId ? getReportById(selectedReportId) : Promise.resolve(null),
  ]);

  const approvedProfiles = allProfiles.filter(profile => profile.status === 'approved');
  const filterProfiles = approvedProfiles.filter(profile => profile.id !== user.id);
  const safeAuthorId = authorId && filterProfiles.some(profile => profile.id === authorId) ? authorId : '';

  const filters = {
    from,
    to,
    reviewStatuses: reviewStatus ? [reviewStatus] : REVIEW_STATUSES,
    recipientId: user.id,
    ...(safeAuthorId ? { authorId: safeAuthorId } : {}),
  };

  const [{ reports, total }] = await Promise.all([
    getReportPage(filters, { page, pageSize: PAGE_SIZE }),
  ]);
  const selectedReport = selectedReportCandidate && canReviewWorkReport({
    reviewer: user,
    report: selectedReportCandidate,
    author: allProfiles.find(profile => profile.id === selectedReportCandidate.authorId),
    permissions,
  })
    ? selectedReportCandidate
    : undefined;
  const reviewableReports = reports.filter(report =>
    canReviewWorkReport({
      reviewer: user,
      report,
      author: allProfiles.find(profile => profile.id === report.authorId),
      permissions,
    })
  );
  const visibleReports = selectedReport && !reviewableReports.some(report => report.id === selectedReport.id)
    ? [selectedReport, ...reviewableReports]
    : reviewableReports;
  const totalPages = getTotalPages(total, PAGE_SIZE);
  const normalizedPage = Math.min(page, totalPages);
  const profileMap = Object.fromEntries(allProfiles.map(profile => [profile.id, profile]));
  const baseParams: Record<string, string> = {
    from,
    to,
    ...(safeAuthorId && { authorId: safeAuthorId }),
    ...(reviewStatus && { status: reviewStatus }),
  };
  if (page > totalPages && total > 0) {
    redirect(buildReviewHref(baseParams, { page: totalPages }));
  }
  const currentParams: Record<string, string> = {
    ...baseParams,
    page: String(normalizedPage),
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Topbar
        title="업무보고 검토"
        breadcrumb={[{ label: '업무게시판', href: '/work-report' }, { label: '검토' }]}
        currentUser={user}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="space-y-4">
          <section className="card p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-bold text-[var(--foreground)]">검토 항목</h2>
                <p className="mt-1 text-[12px] text-[var(--muted)]">총 {total}건 · {normalizedPage}/{totalPages} 페이지</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {REVIEW_STATUSES.map(status => (
                  <Link
                    key={status}
                    href={buildReviewHref(currentParams, { status: reviewStatus === status ? undefined : status, page: 1 })}
                  >
                    <Badge variant={reviewStatus === status ? REVIEW_VARIANT[status] : 'gray'}>
                      {REVIEW_LABEL[status]}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>

            <form className="grid grid-cols-1 gap-2 md:grid-cols-5" action="/work-report/review">
              <input type="date" name="from" defaultValue={from} className="rounded-lg border px-2.5 py-2 text-[12px] outline-none" style={{ borderColor: 'var(--line)' }} />
              <input type="date" name="to" defaultValue={to} className="rounded-lg border px-2.5 py-2 text-[12px] outline-none" style={{ borderColor: 'var(--line)' }} />
              <select name="authorId" defaultValue={safeAuthorId} className="rounded-lg border px-2.5 py-2 text-[12px] outline-none" style={{ borderColor: 'var(--line)' }}>
                <option value="">전체 작성자</option>
                {filterProfiles
                  .map(profile => {
                    const level = profile.role === 'admin'
                      ? 'admin'
                      : permissions.some(permission =>
                        permission.profileId === profile.id &&
                        permission.role === 'leader'
                      )
                        ? 'leader'
                        : 'member';
                    return <option key={profile.id} value={profile.id}>{profile.name} ({REPORT_ACTOR_LABEL[level]})</option>;
                  })}
              </select>
              <select name="status" defaultValue={reviewStatus ?? ''} className="rounded-lg border px-2.5 py-2 text-[12px] outline-none" style={{ borderColor: 'var(--line)' }}>
                <option value="">전체 상태</option>
                {REVIEW_STATUSES.map(status => (
                  <option key={status} value={status}>{REVIEW_LABEL[status]}</option>
                ))}
              </select>
              <button type="submit" className="rounded-lg px-3 py-2 text-[12px] font-semibold text-white" style={{ background: 'var(--indigo-600)' }}>
                조회
              </button>
            </form>
          </section>

          <section className="space-y-2">
            {visibleReports.length === 0 ? (
              <div className="card p-12 text-center text-[13px] text-[var(--muted)]">조건에 맞는 검토 항목이 없습니다.</div>
            ) : (
              <>
                <div
                  className="hidden rounded-lg border bg-[var(--stone-50)] px-3 py-2 text-[11px] font-semibold text-[var(--muted)] md:grid md:grid-cols-[150px_1fr_110px_74px] md:items-center"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <span>부서/상태</span>
                  <span>보고 기간</span>
                  <span>작성자</span>
                  <span className="text-right">상세</span>
                </div>
                {visibleReports.map(report => {
                  const author = profileMap[report.authorId];
                  const authorLevel = getReportAuthorLevel(report, author, permissions);
                  return (
                    <ReviewReportRow
                      key={report.id}
                      report={report}
                      author={author}
                      authorLevel={authorLevel}
                      reviewer={report.reviewerId ? profileMap[report.reviewerId] : undefined}
                      canReview={canReviewWorkReport({ reviewer: user, report, author, permissions })}
                      defaultOpen={selectedReport?.id === report.id}
                    />
                  );
                })}
              </>
            )}
          </section>

          <PaginationNav
            basePath="/work-report/review"
            page={normalizedPage}
            totalPages={totalPages}
            currentParams={currentParams}
          />
        </div>
      </div>
    </div>
  );
}
