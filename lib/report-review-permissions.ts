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
  if (isBoardLeader(report.authorId, report.boardId, permissions)) return 'leader';
  return 'member';
}

export function canReviewWorkReport({
  reviewer,
  report,
  author,
  permissions,
}: {
  reviewer: Pick<Profile, 'id' | 'role'>;
  report: Pick<WorkReport, 'authorId' | 'boardId' | 'recipientId'>;
  author: Pick<Profile, 'role'> | undefined;
  permissions: BoardPermission[];
}) {
  if (reviewer.id === report.authorId) return false;
  if (report.recipientId === reviewer.id) return true;
  if (reviewer.role === 'admin') return true;

  return isBoardLeader(reviewer.id, report.boardId, permissions) &&
    getReportAuthorLevel(report, author, permissions) === 'member';
}

export function canSubmitReviewDecision(report: Pick<WorkReport, 'reviewStatus'>) {
  return report.reviewStatus === 'submitted';
}

export function canReviseWorkReport(report: Pick<WorkReport, 'reviewStatus'>) {
  return report.reviewStatus === 'changes_requested';
}

export function getReviewableAuthorProfiles({
  reviewer,
  boardIds,
  profiles,
  permissions,
}: {
  reviewer: Pick<Profile, 'id' | 'role'>;
  boardIds: string[];
  profiles: Profile[];
  permissions: BoardPermission[];
}) {
  return profiles.filter(profile => {
    if (profile.id === reviewer.id) return false;
    if (reviewer.role === 'admin') return true;
    if (profile.role === 'admin') return false;
    return boardIds.some(boardId => !isBoardLeader(profile.id, boardId, permissions));
  });
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
