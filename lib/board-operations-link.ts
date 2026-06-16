import type { Board } from './types';

export const OPERATIONS_TOOL_URL = 'https://wil-system.vercel.app';

function normalizeBoardName(name: string) {
  return name.replace(/\s+/g, '');
}

export function shouldShowOperationsToolLink(board: Pick<Board, 'name'>) {
  return normalizeBoardName(board.name) === '마케팅/영업';
}
