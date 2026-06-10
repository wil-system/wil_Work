import type { Profile } from './types';

type MemberDeleteCheck =
  | { allowed: true }
  | { allowed: false; error: string };

export function canDeleteMemberProfile(
  actor: Pick<Profile, 'id' | 'role'> | null | undefined,
  targetId: string | null | undefined
): MemberDeleteCheck {
  if (!actor || actor.role !== 'admin') {
    return { allowed: false, error: '관리자만 회원을 삭제할 수 있습니다.' };
  }

  const normalizedTargetId = targetId?.trim();
  if (!normalizedTargetId) {
    return { allowed: false, error: '삭제할 회원을 찾을 수 없습니다.' };
  }

  if (actor.id === normalizedTargetId) {
    return { allowed: false, error: '본인 계정은 삭제할 수 없습니다.' };
  }

  return { allowed: true };
}

export function getMemberDeleteConfirmationMessage(memberName: string): string {
  const safeName = memberName.trim() || '선택한';
  return `"${safeName}" 회원을 삭제할까요?\n삭제하면 권한과 작성한 게시글/댓글 등 관련 기록도 함께 삭제되며 복구할 수 없습니다.`;
}
