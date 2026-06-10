import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canDeleteMemberProfile,
  getMemberDeleteConfirmationMessage,
} from '../lib/member-management.ts';
import type { Profile } from '../lib/types.ts';

const admin: Profile = {
  id: 'admin-1',
  name: '관리자',
  email: 'admin@example.com',
  role: 'admin',
  status: 'approved',
  department: '경영',
  position: '관리자',
  avatarInitial: '관',
  avatarColor: '#000',
  joinedAt: '2026-01-01',
};

const member: Profile = {
  ...admin,
  id: 'member-1',
  name: '김회원',
  email: 'member@example.com',
  role: 'member',
  position: '팀원',
  avatarInitial: '김',
};

test('allows admins to delete another member profile', () => {
  assert.deepEqual(canDeleteMemberProfile(admin, member.id), { allowed: true });
});

test('prevents non-admins and self deletion', () => {
  assert.deepEqual(canDeleteMemberProfile(member, admin.id), {
    allowed: false,
    error: '관리자만 회원을 삭제할 수 있습니다.',
  });
  assert.deepEqual(canDeleteMemberProfile(admin, admin.id), {
    allowed: false,
    error: '본인 계정은 삭제할 수 없습니다.',
  });
});

test('builds a destructive delete confirmation message with member name', () => {
  assert.equal(
    getMemberDeleteConfirmationMessage('김회원'),
    '"김회원" 회원을 삭제할까요?\n삭제하면 권한과 작성한 게시글/댓글 등 관련 기록도 함께 삭제되며 복구할 수 없습니다.'
  );
});
