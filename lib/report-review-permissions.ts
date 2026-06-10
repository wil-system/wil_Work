import type { BoardPermission, Profile, WorkReport } from './types';

export type ReportActorLevel = 'member' | 'leader' | 'admin';

export const REPORT_ACTOR_LABEL: Record<ReportActorLevel, string> = {
  member: '팀원',
  leader: '팀장',
  admin: '관리자',
};

export function isBoardLeader(profileId: string, boardId: string, permissions: BoardPermission[]) {
  return permissions.some(permission =>
    permission.profileId === profileId &&
    permission.boardId === boardId &&
    permission.role === 'leader'
  );
}

export function getReportAuthorLevel(
  report: Pick<WorkReport, 'authorId' | 'boardId'>,
  author: Pick<Profile, 'role'> | undefined,
  permissions: BoardPermission[],
): ReportActorLevel {
  if (author?.role === 'admin') return 'admin';
  if (!report.boardId) return 'member';
  if (isBoardLeader(report.authorId, report.boardId, permissions)) return 'leader';
  return 'member';
}

export function canReviewWorkReport({
  reviewer,
  report,
}: {
  reviewer: Pick<Profile, 'id'>;
  report: Pick<WorkReport, 'authorId' | 'recipientId'>;
  author?: Pick<Profile, 'role'> | undefined;
  permissions?: BoardPermission[];
}) {
  if (reviewer.id === report.authorId) return false;
  return report.recipientId === reviewer.id;
}

export function canSubmitReviewDecision(report: Pick<WorkReport, 'reviewStatus'>) {
  return report.reviewStatus === 'submitted';
}

export function canReviseWorkReport(report: Pick<WorkReport, 'reviewStatus'>) {
  return report.reviewStatus === 'changes_requested';
}

export function getReportRecipientProfiles({
  currentUserId,
  profiles,
}: {
  currentUserId: string;
  profiles: Profile[];
}) {
  return profiles
    .filter(profile => profile.status === 'approved' && profile.id !== currentUserId)
    .sort((a, b) =>
      a.department.localeCompare(b.department, 'ko') ||
      a.name.localeCompare(b.name, 'ko')
    );
}
