import { createClient } from '@/lib/supabase/server';
import { isDemoMode } from '@/lib/demo-mode';
import { mockWorkReports } from '@/lib/mock-data';
import { calculateReportChangeSummary, type ReportChangeSummary } from '@/lib/report-diff';
import { canReviseWorkReport } from '@/lib/report-review-permissions';
import type { ReportPeriodType, ReportReviewStatus, WorkReport } from '@/lib/types';

const demoReports: WorkReport[] = mockWorkReports.map(report => ({ ...report }));

function toTextArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'string') return value.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
  return [];
}

function legacyStatus(reviewStatus: ReportReviewStatus): WorkReport['status'] {
  if (reviewStatus === 'reviewed') return 'reviewed';
  if (reviewStatus === 'draft') return 'draft';
  return 'submitted';
}

function toReport(row: Record<string, unknown>): WorkReport {
  const date = (row.date as string | undefined) ?? (row.period_start as string | undefined) ?? '';
  const goals = toTextArray(row.goals);
  const progress = toTextArray(row.progress ?? row.completed_tasks);
  const nextPlan = toTextArray(row.next_plan ?? row.planned_tasks);
  const reviewStatus = ((row.review_status as ReportReviewStatus | undefined) ??
    (row.status as ReportReviewStatus | undefined) ??
    'draft') as ReportReviewStatus;

  return {
    id: row.id as string,
    authorId: row.author_id as string,
    boardId: (row.board_id as string | undefined) ?? 'feed',
    date,
    periodStart: (row.period_start as string | undefined) ?? date,
    periodEnd: (row.period_end as string | undefined) ?? date,
    periodLabel: (row.period_label as string | undefined) ?? date,
    periodType: ((row.period_type as ReportPeriodType | undefined) ?? 'day'),
    goals,
    progress,
    nextPlan,
    plannedTasks: toTextArray(row.planned_tasks ?? row.next_plan),
    completedTasks: toTextArray(row.completed_tasks ?? row.progress),
    issues: row.issues as string | undefined,
    status: ((row.status as WorkReport['status'] | undefined) ?? legacyStatus(reviewStatus)),
    reviewStatus,
    previousReportId: row.previous_report_id as string | undefined,
    recipientId: row.recipient_id as string | undefined,
    reviewerId: row.reviewer_id as string | undefined,
    reviewComment: row.review_comment as string | undefined,
    reviewedAt: row.reviewed_at as string | undefined,
    createdAt: row.created_at as string | undefined,
    updatedAt: row.updated_at as string | undefined,
  };
}

export interface ReportFilters {
  boardId?: string;
  boardIds?: string[];
  authorId?: string;
  authorIds?: string[];
  recipientId?: string;
  reviewStatus?: ReportReviewStatus;
  reviewStatuses?: ReportReviewStatus[];
  from?: string;
  to?: string;
}

export interface ReportPage {
  reports: WorkReport[];
  total: number;
}

export interface PeriodReportInput {
  authorId: string;
  boardId: string;
  periodStart: string;
  periodEnd: string;
  periodLabel: string;
  periodType: ReportPeriodType;
  goals: string[];
  progress: string[];
  issues?: string;
  nextPlan: string[];
  recipientId: string;
  reviewStatus: Extract<ReportReviewStatus, 'submitted'>;
}

export async function getTodayReports(): Promise<WorkReport[]> {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' });
  return getReports({ from: today, to: today });
}

export async function getReports(filters: ReportFilters = {}): Promise<WorkReport[]> {
  if (isDemoMode()) {
    return demoReports
      .filter(report => !filters.boardId || report.boardId === filters.boardId)
      .filter(report => !filters.boardIds || filters.boardIds.includes(report.boardId))
      .filter(report => !filters.authorId || report.authorId === filters.authorId)
      .filter(report => !filters.authorIds || filters.authorIds.includes(report.authorId))
      .filter(report => !filters.recipientId || report.recipientId === filters.recipientId)
      .filter(report => !filters.reviewStatus || report.reviewStatus === filters.reviewStatus)
      .filter(report => !filters.reviewStatuses || filters.reviewStatuses.includes(report.reviewStatus))
      .filter(report => !filters.from || report.periodEnd >= filters.from)
      .filter(report => !filters.to || report.periodStart <= filters.to)
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart) || (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  }

  const supabase = await createClient();
  let query = supabase
    .from('work_reports')
    .select('*')
    .order('period_start', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  if (filters.boardId) query = query.eq('board_id', filters.boardId);
  if (filters.boardIds) {
    if (filters.boardIds.length === 0) return [];
    query = query.in('board_id', filters.boardIds);
  }
  if (filters.authorId) query = query.eq('author_id', filters.authorId);
  if (filters.authorIds) {
    if (filters.authorIds.length === 0) return [];
    query = query.in('author_id', filters.authorIds);
  }
  if (filters.recipientId) query = query.eq('recipient_id', filters.recipientId);
  if (filters.reviewStatus) query = query.eq('review_status', filters.reviewStatus);
  if (filters.reviewStatuses) {
    if (filters.reviewStatuses.length === 0) return [];
    query = query.in('review_status', filters.reviewStatuses);
  }
  if (filters.from) query = query.gte('period_end', filters.from);
  if (filters.to) query = query.lte('period_start', filters.to);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(toReport);
}

export async function getReportPage(
  filters: ReportFilters = {},
  pagination: { page: number; pageSize: number },
): Promise<ReportPage> {
  const page = Math.max(1, pagination.page);
  const pageSize = Math.min(Math.max(1, pagination.pageSize), 50);
  const offset = (page - 1) * pageSize;

  if (isDemoMode()) {
    const filtered = await getReports(filters);
    return {
      reports: filtered.slice(offset, offset + pageSize),
      total: filtered.length,
    };
  }

  if (filters.boardIds?.length === 0 || filters.authorIds?.length === 0 || filters.reviewStatuses?.length === 0) {
    return { reports: [], total: 0 };
  }

  const supabase = await createClient();
  let query = supabase
    .from('work_reports')
    .select('*', { count: 'exact' })
    .order('period_start', { ascending: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (filters.boardId) query = query.eq('board_id', filters.boardId);
  if (filters.boardIds) query = query.in('board_id', filters.boardIds);
  if (filters.authorId) query = query.eq('author_id', filters.authorId);
  if (filters.authorIds) query = query.in('author_id', filters.authorIds);
  if (filters.recipientId) query = query.eq('recipient_id', filters.recipientId);
  if (filters.reviewStatus) query = query.eq('review_status', filters.reviewStatus);
  if (filters.reviewStatuses) query = query.in('review_status', filters.reviewStatuses);
  if (filters.from) query = query.gte('period_end', filters.from);
  if (filters.to) query = query.lte('period_start', filters.to);

  const { data, error, count } = await query;
  if (error) throw error;
  return {
    reports: (data ?? []).map(toReport),
    total: count ?? 0,
  };
}

export async function getMyReportHistoryPage(
  authorId: string,
  pagination: { page: number; pageSize: number },
): Promise<ReportPage> {
  return getReportPage({ authorId }, pagination);
}

export async function getMyReportHistory(authorId: string): Promise<WorkReport[]> {
  const { reports } = await getMyReportHistoryPage(authorId, { page: 1, pageSize: 20 });
  return reports;
}

export async function getReportById(reportId: string): Promise<WorkReport | null> {
  if (isDemoMode()) return demoReports.find(report => report.id === reportId) ?? null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_reports')
    .select('*')
    .eq('id', reportId)
    .maybeSingle();

  if (error) throw error;
  return data ? toReport(data) : null;
}

async function getReportsByIds(reportIds: string[]): Promise<WorkReport[]> {
  if (reportIds.length === 0) return [];
  if (isDemoMode()) return demoReports.filter(report => reportIds.includes(report.id));

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_reports')
    .select('*')
    .in('id', reportIds);

  if (error) throw error;
  return (data ?? []).map(toReport);
}

export async function getPreviousReport(
  authorId: string,
  boardId: string,
  periodStart: string,
): Promise<WorkReport | null> {
  if (isDemoMode()) {
    return demoReports
      .filter(report => report.authorId === authorId && report.boardId === boardId && report.periodStart < periodStart)
      .sort((a, b) => b.periodStart.localeCompare(a.periodStart))
      [0] ?? null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('work_reports')
    .select('*')
    .eq('author_id', authorId)
    .eq('board_id', boardId)
    .lt('period_start', periodStart)
    .order('period_start', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? toReport(data) : null;
}

export async function savePeriodReport(report: PeriodReportInput & { reportId?: string }): Promise<string> {
  if (isDemoMode()) {
    const previousReport = await getPreviousReport(report.authorId, report.boardId, report.periodStart);
    const existingIndex = report.reportId
      ? demoReports.findIndex(item => item.id === report.reportId && item.authorId === report.authorId)
      : -1;

    if (report.reportId && existingIndex < 0) {
      throw new Error('Report not found.');
    }
    if (existingIndex >= 0 && !canReviseWorkReport(demoReports[existingIndex])) {
      throw new Error('Only reports with requested changes can be edited.');
    }

    const id = existingIndex >= 0 ? demoReports[existingIndex].id : `demo-report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const next: WorkReport = {
      id,
      authorId: report.authorId,
      boardId: report.boardId,
      date: report.periodStart,
      periodStart: report.periodStart,
      periodEnd: report.periodEnd,
      periodLabel: report.periodLabel,
      periodType: report.periodType,
      goals: report.goals,
      progress: report.progress,
      issues: report.issues,
      nextPlan: report.nextPlan,
      plannedTasks: report.nextPlan,
      completedTasks: report.progress,
      status: legacyStatus(report.reviewStatus),
      reviewStatus: report.reviewStatus,
      previousReportId: demoReports[existingIndex]?.previousReportId ?? previousReport?.id,
      recipientId: report.recipientId,
      createdAt: demoReports[existingIndex]?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (existingIndex >= 0) demoReports[existingIndex] = next;
    else demoReports.unshift(next);
    return id;
  }

  const supabase = await createClient();
  const previousReport = await getPreviousReport(report.authorId, report.boardId, report.periodStart);
  let previousReportId = previousReport?.id ?? null;

  if (report.reportId) {
    const { data: existing, error: existingError } = await supabase
      .from('work_reports')
      .select('id, author_id, review_status, previous_report_id')
      .eq('id', report.reportId)
      .maybeSingle();

    if (existingError) throw existingError;
    if (!existing || existing.author_id !== report.authorId) {
      throw new Error('Report not found.');
    }
    if (!canReviseWorkReport({ reviewStatus: existing.review_status as ReportReviewStatus })) {
      throw new Error('Only reports with requested changes can be edited.');
    }
    previousReportId = existing.previous_report_id ?? previousReportId;
  }

  const payload = {
    author_id: report.authorId,
    board_id: report.boardId,
    date: report.periodStart,
    period_start: report.periodStart,
    period_end: report.periodEnd,
    period_label: report.periodLabel,
    period_type: report.periodType,
    goals: report.goals,
    progress: report.progress,
    issues: report.issues ?? null,
    next_plan: report.nextPlan,
    planned_tasks: report.nextPlan,
    completed_tasks: report.progress,
    status: legacyStatus(report.reviewStatus),
    review_status: report.reviewStatus,
    recipient_id: report.recipientId,
    reviewer_id: null,
    review_comment: null,
    reviewed_at: null,
    previous_report_id: previousReportId,
    updated_at: new Date().toISOString(),
  };

  const query = report.reportId
    ? supabase
      .from('work_reports')
      .update(payload)
      .eq('id', report.reportId)
      .eq('author_id', report.authorId)
    : supabase
      .from('work_reports')
      .insert(payload);

  const { data, error } = await query
    .select('id')
    .single();

  if (error) throw error;
  return data.id as string;
}

export async function reviewReport({
  reportId,
  reviewerId,
  reviewStatus,
  reviewComment,
}: {
  reportId: string;
  reviewerId: string;
  reviewStatus: Extract<ReportReviewStatus, 'reviewed' | 'changes_requested'>;
  reviewComment?: string;
}): Promise<void> {
  if (isDemoMode()) {
    const report = demoReports.find(item => item.id === reportId);
    if (!report) return;
    report.status = legacyStatus(reviewStatus);
    report.reviewStatus = reviewStatus;
    report.reviewerId = reviewerId;
    report.reviewComment = reviewComment;
    report.reviewedAt = new Date().toISOString();
    report.updatedAt = new Date().toISOString();
    return;
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('work_reports')
    .update({
      status: legacyStatus(reviewStatus),
      review_status: reviewStatus,
      reviewer_id: reviewerId,
      review_comment: reviewComment ?? null,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId);

  if (error) throw error;
}

export async function getReportChangeSummaries(
  reports: WorkReport[],
): Promise<Record<string, ReportChangeSummary>> {
  const previousIds = [...new Set(reports.map(report => report.previousReportId).filter(Boolean))] as string[];
  const previousReports = await getReportsByIds(previousIds);
  const previousById = Object.fromEntries(previousReports.map(report => [report.id, report]));

  return Object.fromEntries(reports.map(report => [
    report.id,
    calculateReportChangeSummary({
      previous: report.previousReportId ? previousById[report.previousReportId] ?? null : null,
      current: report,
    }),
  ]));
}

export async function createReportNotifications(
  reportId: string,
  event: 'submitted' | 'reviewed' | 'changes_requested',
): Promise<void> {
  if (isDemoMode()) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc('create_report_notifications', {
    p_report_id: reportId,
    p_event: event,
  });
  if (error) throw error;
}
