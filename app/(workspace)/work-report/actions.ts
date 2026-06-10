'use server';
import { revalidatePath } from 'next/cache';
import { getAccessibleBoards, getAllBoardPermissions } from '@/lib/db/boards';
import {
  createReportNotifications,
  getReportById,
  reviewReport,
  savePeriodReport,
} from '@/lib/db/reports';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { canReviewWorkReport, canSubmitReviewDecision, getReportAuthorLevel, getReportRecipientProfiles } from '@/lib/report-review-permissions';
import { normalizeReportItems } from '@/lib/report-diff';
import type { ReportPeriodType, ReportReviewStatus } from '@/lib/types';

function isPeriodType(value: string): value is ReportPeriodType {
  return value === 'day' || value === 'week' || value === 'month' || value === 'custom';
}

function parseDate(value: FormDataEntryValue | null) {
  const text = String(value ?? '').trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : '';
}

export async function submitReport(formData: FormData): Promise<{ success: boolean; error?: string; reportId?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const reportId = String(formData.get('reportId') ?? '').trim();
  const boardId = String(formData.get('boardId') ?? '').trim();
  const periodStart = parseDate(formData.get('periodStart'));
  const periodEnd = parseDate(formData.get('periodEnd'));
  const periodLabel = (String(formData.get('periodLabel') ?? '').trim()) || `${periodStart} ~ ${periodEnd}`;
  const periodTypeRaw = String(formData.get('periodType') ?? 'custom');
  const periodType = isPeriodType(periodTypeRaw) ? periodTypeRaw : 'custom';
  const recipientId = String(formData.get('recipientId') ?? '').trim();
  const reviewStatus: Extract<ReportReviewStatus, 'submitted'> = 'submitted';

  if (!periodStart || !periodEnd) return { success: false, error: '기간을 선택하세요.' };
  if (periodStart > periodEnd) return { success: false, error: '종료일은 시작일 이후여야 합니다.' };
  if (!recipientId) return { success: false, error: '수신자를 선택하세요.' };

  const [accessibleBoards, profiles] = await Promise.all([
    getAccessibleBoards(user.id),
    getAllProfiles(),
  ]);
  const reportBoards = accessibleBoards.filter(board => board.id !== 'feed' && board.id !== 'notice');
  if (!reportBoards.some(board => board.id === boardId)) {
    return { success: false, error: '선택한 부서에 보고서를 작성할 권한이 없습니다.' };
  }
  const recipientOptions = getReportRecipientProfiles({ currentUserId: user.id, profiles });
  if (!recipientOptions.some(profile => profile.id === recipientId)) {
    return { success: false, error: '선택할 수 없는 수신자입니다.' };
  }

  const goals = normalizeReportItems(String(formData.get('goals') ?? ''));
  const progress = normalizeReportItems(String(formData.get('progress') ?? ''));
  const issues = String(formData.get('issues') ?? '').trim();
  const nextPlan = normalizeReportItems(String(formData.get('nextPlan') ?? ''));

  if (goals.length === 0 && progress.length === 0 && nextPlan.length === 0 && !issues) {
    return { success: false, error: '보고 내용을 하나 이상 입력하세요.' };
  }

  try {
    const savedReportId = await savePeriodReport({
      reportId: reportId || undefined,
      authorId: user.id,
      boardId,
      periodStart,
      periodEnd,
      periodLabel,
      periodType,
      goals,
      progress,
      issues: issues || undefined,
      nextPlan,
      recipientId,
      reviewStatus,
    });
    try {
      await createReportNotifications(savedReportId, 'submitted');
    } catch {}
    revalidatePath('/work-report');
    revalidatePath('/work-report/review');
    revalidatePath('/notifications');
    return { success: true, reportId: savedReportId };
  } catch (error) {
    if (error instanceof Error && error.message.includes('Only reports with requested changes')) {
      return { success: false, error: '수정요청 상태의 업무보고만 다시 제출할 수 있습니다.' };
    }
    const message = error instanceof Error && error.message.includes('Reviewed reports')
      ? '검토 완료된 보고서는 수정할 수 없습니다.'
      : '제출 중 오류가 발생했습니다.';
    return { success: false, error: message };
  }
}

export async function reviewReportAction(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await getCurrentProfile();
  if (!user) return { success: false, error: '로그인이 필요합니다.' };

  const reportId = String(formData.get('reportId') ?? '').trim();
  const nextStatus = String(formData.get('reviewStatus') ?? '') as ReportReviewStatus;
  const reviewComment = String(formData.get('reviewComment') ?? '').trim();

  if (nextStatus !== 'reviewed' && nextStatus !== 'changes_requested') {
    return { success: false, error: '검토 상태가 올바르지 않습니다.' };
  }

  try {
    const report = await getReportById(reportId);
    if (report && !canSubmitReviewDecision(report)) {
      return { success: false, error: '이미 처리된 업무보고입니다.' };
    }
    if (!report) return { success: false, error: '보고서를 찾을 수 없습니다.' };

    const [profiles, permissions] = await Promise.all([
      getAllProfiles(),
      getAllBoardPermissions(),
    ]);
    const author = profiles.find(profile => profile.id === report.authorId);
    const authorLevel = getReportAuthorLevel(report, author, permissions);

    if (!canReviewWorkReport({ reviewer: user, report, author, permissions })) {
      return {
        success: false,
        error: authorLevel === 'leader'
          ? '팀장 업무보고는 관리자만 검토할 수 있습니다.'
          : '검토 권한이 없습니다.',
      };
    }

    await reviewReport({
      reportId,
      reviewerId: user.id,
      reviewStatus: nextStatus,
      reviewComment: reviewComment || undefined,
    });
    try {
      await createReportNotifications(reportId, nextStatus);
    } catch {}
    revalidatePath('/work-report');
    revalidatePath('/work-report/review');
    revalidatePath('/notifications');
    return { success: true };
  } catch {
    return { success: false, error: '검토 상태 저장 중 오류가 발생했습니다.' };
  }
}
