import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ClipboardCheck, History, PencilLine } from 'lucide-react';
import PaginationNav, { buildPaginationHref } from '@/components/pagination-nav';
import Topbar from '@/components/topbar';
import { Badge } from '@/components/ui/badge';
import { getAccessibleBoards } from '@/lib/db/boards';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';
import { getMyReportHistoryPage, getReportById } from '@/lib/db/reports';
import { getTotalPages, parsePageParam } from '@/lib/pagination';
import { canReviseWorkReport, getReportRecipientProfiles } from '@/lib/report-review-permissions';
import { getWorkReportBoardLabel } from '@/lib/work-report-boards';
import type { ReportReviewStatus, WorkReport } from '@/lib/types';
import WorkReportForm from '@/components/work-report-form';

const HISTORY_PAGE_SIZE = 15;

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

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function ReportItems({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">{title}</div>
      {items.length === 0 ? (
        <div className="rounded-md bg-[var(--stone-50)] px-2.5 py-2 text-[12px] text-[var(--stone-400)]">입력 없음</div>
      ) : (
        <ul className="space-y-1">
          {items.map(item => (
            <li key={item} className="rounded-md bg-[var(--stone-50)] px-2.5 py-1.5 text-[12px] text-[var(--stone-700)]">
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ReportDetail({
  report,
  departmentName,
  reviewerName,
  closeHref,
}: {
  report: WorkReport;
  departmentName: string;
  reviewerName?: string;
  closeHref: string;
}) {
  const canEdit = canReviseWorkReport(report);

  return (
    <div className="mb-4 rounded-lg border bg-white p-4" style={{ borderColor: 'var(--line)' }}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-[14px] font-bold text-[var(--foreground)]">{report.periodLabel}</h3>
            <Badge variant={REVIEW_VARIANT[report.reviewStatus]}>{REVIEW_LABEL[report.reviewStatus]}</Badge>
          </div>
          <div className="mt-1 text-[11px] text-[var(--muted)]">
            {departmentName} · {report.periodStart.replace(/-/g, '.')} - {report.periodEnd.replace(/-/g, '.')}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Link
              href={`/work-report?mode=write&report=${report.id}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--indigo-600)' }}
            >
              <PencilLine size={14} />
              수정하기
            </Link>
          )}
          <Link href={closeHref} className="rounded-lg border px-3 py-2 text-[12px] font-semibold text-[var(--stone-600)] hover:bg-[var(--stone-50)]" style={{ borderColor: 'var(--line)' }}>
            닫기
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportItems title="목표" items={report.goals} />
        <ReportItems title="진행업무" items={report.progress} />
        <div>
          <div className="mb-1.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">이슈사항</div>
          <div className="min-h-10 whitespace-pre-line rounded-md bg-[var(--stone-50)] px-2.5 py-2 text-[12px] text-[var(--stone-700)]">
            {report.issues || '입력 없음'}
          </div>
        </div>
        <ReportItems title="다음계획" items={report.nextPlan} />
      </div>

      {report.reviewComment && (
        <div className="mt-4 rounded-lg bg-[var(--indigo-50)] px-3 py-2 text-[12px] text-[var(--stone-700)]">
          <span className="font-semibold text-[var(--indigo-700)]">검토 코멘트</span>
          <span className="text-[var(--stone-400)]"> · </span>
          <span className="font-semibold text-[var(--stone-700)]">{reviewerName ?? '검토자'}</span>
          <span> · {report.reviewComment}</span>
        </div>
      )}
    </div>
  );
}

export default async function WorkReportPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const user = await getCurrentProfile();
  if (!user) redirect('/login');
  const selectedReportId = one(params.report) || '';
  const isWriting = one(params.mode) === 'write';
  const page = parsePageParam(one(params.page));

  const [boards, unreadCount, historyPage, allProfiles, selectedReportCandidate] = await Promise.all([
    getAccessibleBoards(user.id),
    getUnreadNotificationCount(),
    getMyReportHistoryPage(user.id, { page, pageSize: HISTORY_PAGE_SIZE }),
    getAllProfiles(),
    selectedReportId ? getReportById(selectedReportId) : Promise.resolve(null),
  ]);

  const canReview = true;
  const recipientOptions = getReportRecipientProfiles({ currentUserId: user.id, profiles: allProfiles });

  const boardMap = Object.fromEntries(boards.map(board => [board.id, board]));
  const profileMap = Object.fromEntries(allProfiles.map(profile => [profile.id, profile]));
  const myHistory = historyPage.reports;
  const totalPages = getTotalPages(historyPage.total, HISTORY_PAGE_SIZE);
  const normalizedPage = Math.min(page, totalPages);
  const historyParams: Record<string, string | undefined> = {
    ...(normalizedPage > 1 && { page: String(normalizedPage) }),
  };
  const selectedReport = selectedReportCandidate?.authorId === user.id ? selectedReportCandidate : undefined;
  const editableReport = isWriting && selectedReport && canReviseWorkReport(selectedReport) ? selectedReport : undefined;
  const isEditingReport = Boolean(editableReport);

  if (page > totalPages && historyPage.total > 0) {
    redirect(buildPaginationHref('/work-report', {}, { page: totalPages }));
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <Topbar
        title={isEditingReport ? '업무보고 수정' : isWriting ? '업무보고 작성' : '내 보고 히스토리'}
        subtitle={isEditingReport ? '수정요청 받은 업무보고를 보완해 다시 제출합니다' : isWriting ? undefined : '제출한 업무보고를 누적 확인합니다'}
        breadcrumb={[{ label: '업무게시판', href: '/work-report' }, { label: isWriting ? '작성' : '히스토리' }]}
        currentUser={user}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        {isWriting ? (
          <div className="mx-auto max-w-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link
                href="/work-report"
                className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-[12px] font-semibold text-[var(--stone-700)] transition-colors hover:bg-[var(--stone-50)]"
                style={{ borderColor: 'var(--line)' }}
              >
                <History size={14} className="text-[var(--stone-500)]" />
                내 보고 히스토리
              </Link>
              {canReview && (
                <Link
                  href="/work-report/review"
                  className="inline-flex items-center gap-1.5 rounded-lg border bg-white px-3 py-2 text-[12px] font-semibold text-[var(--stone-700)] transition-colors hover:bg-[var(--stone-50)]"
                  style={{ borderColor: 'var(--line)' }}
                >
                  <ClipboardCheck size={14} className="text-[var(--indigo-500)]" />
                  검토 항목
                </Link>
              )}
            </div>
            <WorkReportForm recipients={recipientOptions} report={editableReport} />
          </div>
        ) : (
          <section className="card mx-auto max-w-5xl p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-[14px] font-bold text-[var(--foreground)]">내 보고 히스토리</h2>
                <p className="mt-1 text-[12px] text-[var(--muted)]">총 {historyPage.total}건 · {normalizedPage}/{totalPages} 페이지</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  href="/work-report?mode=write"
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'var(--indigo-600)' }}
                >
                  <PencilLine size={14} />
                  업무보고 작성
                </Link>
              </div>
            </div>

            {canReview && (
              <Link
                href="/work-report/review"
                className="mb-4 flex items-center justify-between rounded-lg border bg-white px-4 py-3 text-[12px] font-semibold text-[var(--stone-700)] transition-colors hover:bg-[var(--stone-50)]"
                style={{ borderColor: 'var(--line)' }}
              >
                <span>검토 항목으로 이동</span>
                <ClipboardCheck size={15} className="text-[var(--indigo-500)]" />
              </Link>
            )}

            {historyPage.total === 0 ? (
              <div className="rounded-lg border border-dashed px-4 py-10 text-center text-[13px] text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
                아직 작성한 보고가 없습니다.
              </div>
            ) : (
              <>
                {selectedReport ? (
                  <ReportDetail
                    report={selectedReport}
                    departmentName={getWorkReportBoardLabel(selectedReport.boardId, selectedReport.boardId ? boardMap[selectedReport.boardId] : undefined)}
                    reviewerName={selectedReport.reviewerId ? profileMap[selectedReport.reviewerId]?.name : undefined}
                    closeHref={buildPaginationHref('/work-report', historyParams, { report: undefined })}
                  />
                ) : (
                  <div className="mb-4 rounded-lg border border-dashed px-4 py-6 text-center text-[13px] text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
                    히스토리 항목을 선택하면 상세 내용을 볼 수 있습니다.
                  </div>
                )}

                <div className="overflow-hidden rounded-lg border" style={{ borderColor: 'var(--line)' }}>
                  <div className="hidden grid-cols-[1fr_110px_120px] gap-3 bg-[var(--stone-50)] px-3 py-2 text-[11px] font-semibold text-[var(--muted)] sm:grid">
                    <span>보고 기간</span>
                    <span>부서</span>
                    <span>상태</span>
                  </div>
                  <div className="divide-y" style={{ borderColor: 'var(--line)' }}>
                    {myHistory.map(report => {
                      const isSelected = selectedReport?.id === report.id;
                      return (
                        <Link
                          key={report.id}
                          href={buildPaginationHref('/work-report', historyParams, { report: report.id })}
                          aria-current={isSelected ? 'true' : undefined}
                          className="grid grid-cols-1 gap-2 px-3 py-3 text-[12px] transition-colors hover:bg-[var(--stone-50)] sm:grid-cols-[1fr_110px_120px] sm:items-center"
                          style={{ background: isSelected ? 'var(--indigo-50)' : 'white' }}
                        >
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-[var(--foreground)]">{report.periodLabel}</div>
                            <div className="mt-0.5 text-[10px] text-[var(--muted)]">
                              {report.periodStart.replace(/-/g, '.')} - {report.periodEnd.replace(/-/g, '.')}
                            </div>
                          </div>
                          <span className="text-[11px] text-[var(--stone-600)]">{getWorkReportBoardLabel(report.boardId, report.boardId ? boardMap[report.boardId] : undefined)}</span>
                          <Badge variant={REVIEW_VARIANT[report.reviewStatus]}>{REVIEW_LABEL[report.reviewStatus]}</Badge>
                        </Link>
                      );
                    })}
                  </div>
                </div>
                <PaginationNav
                  basePath="/work-report"
                  page={normalizedPage}
                  totalPages={totalPages}
                  currentParams={historyParams}
                />
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
