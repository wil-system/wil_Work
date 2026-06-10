import type { Board } from './types';

export const UNASSIGNED_WORK_REPORT_BOARD_LABEL = '부서 미지정';

const SYSTEM_REPORT_BOARD_IDS = new Set(['feed', 'notice']);
const SYSTEM_REPORT_BOARD_NAMES = new Set(['전체 부서', '전체 피드', '공지사항']);

export function isWorkReportBoard(board: Pick<Board, 'id' | 'name'>) {
  return !SYSTEM_REPORT_BOARD_IDS.has(board.id) && !SYSTEM_REPORT_BOARD_NAMES.has(board.name.trim());
}

export function getWorkReportBoards<T extends Pick<Board, 'id' | 'name'>>(boards: T[]) {
  return boards.filter(isWorkReportBoard);
}

export function getWorkReportBoardLabel(boardId?: string | null, board?: Pick<Board, 'name'>) {
  return boardId ? board?.name ?? boardId : UNASSIGNED_WORK_REPORT_BOARD_LABEL;
}
