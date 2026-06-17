import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWorkReportDepartmentLabel,
  getWorkReportBoardLabel,
  getWorkReportBoards,
  UNASSIGNED_WORK_REPORT_BOARD_LABEL,
  isWorkReportBoard,
} from '../lib/work-report-boards.ts';
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

test('labels reports without a board as unassigned', () => {
  assert.equal(getWorkReportBoardLabel(undefined), UNASSIGNED_WORK_REPORT_BOARD_LABEL);
  assert.equal(getWorkReportBoardLabel(null), UNASSIGNED_WORK_REPORT_BOARD_LABEL);
  assert.equal(getWorkReportBoardLabel('sales', board('sales', '영업팀')), '영업팀');
});

test('uses the author department when a work report has no board', () => {
  assert.equal(getWorkReportDepartmentLabel(undefined, undefined, { department: '영업팀' }), '영업팀');
  assert.equal(getWorkReportDepartmentLabel(null, undefined, { department: '  개발팀  ' }), '개발팀');
  assert.equal(getWorkReportDepartmentLabel(undefined, undefined, { department: '' }), UNASSIGNED_WORK_REPORT_BOARD_LABEL);
  assert.equal(getWorkReportDepartmentLabel('sales', board('sales', '영업팀'), { department: '개발팀' }), '영업팀');
});
