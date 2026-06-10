import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canReviseWorkReport,
  canSubmitReviewDecision,
  canReviewWorkReport,
  getReportAuthorLevel,
  getReportRecipientProfiles,
} from '../lib/report-review-permissions.ts';
import type { BoardPermission, Profile, WorkReport } from '../lib/types.ts';

const permissions: BoardPermission[] = [
  { profileId: 'leader-1', boardId: 'sales', role: 'leader' },
  { profileId: 'leader-2', boardId: 'sales', role: 'leader' },
];

const profiles: Profile[] = [
  { id: 'admin-1', name: '관리자', email: 'admin@example.com', role: 'admin', status: 'approved', department: '경영', position: '관리자', avatarInitial: '관', avatarColor: '#000', joinedAt: '2026-01-01' },
  { id: 'leader-1', name: '팀장1', email: 'leader1@example.com', role: 'member', status: 'approved', department: '영업', position: '팀장', avatarInitial: '팀', avatarColor: '#000', joinedAt: '2026-01-01' },
  { id: 'leader-2', name: '팀장2', email: 'leader2@example.com', role: 'member', status: 'approved', department: '영업', position: '팀장', avatarInitial: '팀', avatarColor: '#000', joinedAt: '2026-01-01' },
  { id: 'member-1', name: '팀원1', email: 'member1@example.com', role: 'member', status: 'approved', department: '영업', position: '팀원', avatarInitial: '팀', avatarColor: '#000', joinedAt: '2026-01-01' },
];

function report(authorId: string): Pick<WorkReport, 'authorId' | 'boardId'> {
  return { authorId, boardId: 'sales' };
}

test('classifies report authors by admin, board leader, and member', () => {
  assert.equal(getReportAuthorLevel(report('admin-1'), profiles[0], permissions), 'admin');
  assert.equal(getReportAuthorLevel(report('leader-1'), profiles[1], permissions), 'leader');
  assert.equal(getReportAuthorLevel(report('member-1'), profiles[3], permissions), 'member');
});

test('does not allow hierarchy reviewers unless they are the selected recipient', () => {
  assert.equal(canReviewWorkReport({
    reviewer: profiles[1],
    report: report('member-1'),
    author: profiles[3],
    permissions,
  }), false);

  assert.equal(canReviewWorkReport({
    reviewer: profiles[0],
    report: report('leader-1'),
    author: profiles[1],
    permissions,
  }), false);
});

test('prevents self review even if the report recipient is the author', () => {
  assert.equal(canReviewWorkReport({
    reviewer: profiles[0],
    report: { ...report('admin-1'), recipientId: 'admin-1' },
    author: profiles[0],
    permissions,
  }), false);
});

test('allows a selected recipient to review a delivered report', () => {
  assert.equal(canReviewWorkReport({
    reviewer: profiles[3],
    report: { ...report('admin-1'), recipientId: 'member-1' },
    author: profiles[0],
    permissions,
  }), true);

  assert.equal(canReviewWorkReport({
    reviewer: profiles[3],
    report: { ...report('admin-1'), recipientId: 'leader-1' },
    author: profiles[0],
    permissions,
  }), false);
});

test('builds report recipient options from approved users excluding the author', () => {
  const recipients = getReportRecipientProfiles({
    currentUserId: 'member-1',
    profiles: [
      ...profiles,
      { id: 'pending-1', name: '대기자', email: 'pending@example.com', role: 'member', status: 'pending', department: '영업', position: '대기', avatarInitial: '대', avatarColor: '#000', joinedAt: '2026-01-01' },
    ],
  });

  assert.deepEqual(recipients.map(recipient => recipient.id), ['admin-1', 'leader-1', 'leader-2']);
});

test('allows review decisions only for reports waiting for review', () => {
  assert.equal(canSubmitReviewDecision({ reviewStatus: 'submitted' }), true);
  assert.equal(canSubmitReviewDecision({ reviewStatus: 'changes_requested' }), false);
  assert.equal(canSubmitReviewDecision({ reviewStatus: 'reviewed' }), false);
});

test('allows authors to revise only reports with requested changes', () => {
  assert.equal(canReviseWorkReport({ reviewStatus: 'changes_requested' }), true);
  assert.equal(canReviseWorkReport({ reviewStatus: 'submitted' }), false);
  assert.equal(canReviseWorkReport({ reviewStatus: 'reviewed' }), false);
});
