import test from 'node:test';
import assert from 'node:assert/strict';
import { getChangedMemberUpdates } from '../lib/member-updates.ts';
import type { UserRole } from '../lib/types.ts';

const original = [
  { id: 'u1', department: '영업팀', position: '팀장', role: 'member' as UserRole },
  { id: 'u2', department: '개발팀', position: '팀원', role: 'admin' as UserRole },
];

test('builds a bulk-save payload only for changed members', () => {
  const updates = getChangedMemberUpdates(original, [
    { id: 'u1', department: ' 영업팀 ', position: '팀장', role: 'member' },
    { id: 'u2', department: '개발팀', position: '리더', role: 'member' },
  ]);

  assert.deepEqual(updates, [
    { id: 'u2', department: '개발팀', position: '리더', role: 'member' },
  ]);
});

test('ignores rows that are not in the original member list', () => {
  const updates = getChangedMemberUpdates(original, [
    { id: 'unknown', department: '총무팀', position: '팀원', role: 'member' },
  ]);

  assert.deepEqual(updates, []);
});
