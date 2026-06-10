import type { UserRole } from './types.ts';

export interface MemberUpdateInput {
  id: string;
  department: string;
  position: string;
  role: UserRole;
}

export function normalizeMemberUpdate(member: MemberUpdateInput): MemberUpdateInput {
  return {
    id: member.id,
    department: member.department.trim(),
    position: member.position.trim(),
    role: member.role,
  };
}

export function getChangedMemberUpdates(
  originalMembers: ReadonlyArray<MemberUpdateInput>,
  editedMembers: ReadonlyArray<MemberUpdateInput>
): MemberUpdateInput[] {
  const originalById = new Map(
    originalMembers.map(member => [member.id, normalizeMemberUpdate(member)])
  );

  return editedMembers
    .map(normalizeMemberUpdate)
    .filter(member => {
      const original = originalById.get(member.id);
      if (!original) return false;

      return original.department !== member.department ||
        original.position !== member.position ||
        original.role !== member.role;
    });
}
