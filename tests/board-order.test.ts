import test from 'node:test';
import assert from 'node:assert/strict';
import { orderBoardsForMenu, orderBoardsForSidebar } from '../lib/board-order.ts';

const boards = [
  { id: 'feed', name: '전체 피드' },
  { id: 'sales', name: '영업팀' },
  { id: 'notice', name: '공지사항' },
  { id: 'dev', name: '개발팀' },
];

test('board menu order keeps system boards ahead of team boards', () => {
  assert.deepEqual(
    orderBoardsForMenu(boards).map(board => board.id),
    ['feed', 'notice', 'sales', 'dev'],
  );
});

test('sidebar board order hides feed and shows notice first', () => {
  assert.deepEqual(
    orderBoardsForSidebar(boards).map(board => board.id),
    ['notice', 'sales', 'dev'],
  );
});
