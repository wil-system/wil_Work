import test from 'node:test';
import assert from 'node:assert/strict';
import { getWorkReportBoards, isWorkReportBoard } from '../lib/work-report-boards.ts';
import type { Board } from '../lib/types.ts';

function board(id: string, name: string): Board {
  return {
    id,
    name,
    description: '',
    icon: 'Dot',
    isPublic: true,
    createdAt: '2026-01-01',
  };
}

test('excludes system and all-department boards from work report department choices', () => {
  assert.equal(isWorkReportBoard(board('feed', '전체 피드')), false);
  assert.equal(isWorkReportBoard(board('notice', '공지사항')), false);
  assert.equal(isWorkReportBoard(board('all-department', '전체 부서')), false);
  assert.equal(isWorkReportBoard(board('sales', '영업팀')), true);

  assert.deepEqual(
    getWorkReportBoards([
      board('feed', '전체 피드'),
      board('all-department', '전체 부서'),
      board('sales', '영업팀'),
    ]).map(item => item.id),
    ['sales'],
  );
});
