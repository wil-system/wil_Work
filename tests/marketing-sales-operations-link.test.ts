import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OPERATIONS_TOOL_URL, shouldShowOperationsToolLink } from '../lib/board-operations-link.ts';

test('shows the operations tool link only for the marketing sales board name', () => {
  assert.equal(OPERATIONS_TOOL_URL, 'https://wil-system.vercel.app');
  assert.equal(shouldShowOperationsToolLink({ id: 'board-random', name: '마케팅/영업' }), true);
  assert.equal(shouldShowOperationsToolLink({ id: 'board-random', name: ' 마케팅 / 영업 ' }), true);
  assert.equal(shouldShowOperationsToolLink({ id: 'marketing', name: '마케팅' }), false);
  assert.equal(shouldShowOperationsToolLink({ id: 'sales', name: '영업팀' }), false);
});

test('board page renders the operations tool link from the marketing sales predicate', () => {
  const boardPageSource = readFileSync(resolve('app/(workspace)/board/[boardId]/page.tsx'), 'utf8');

  assert.match(boardPageSource, /shouldShowOperationsToolLink\(board\)/);
  assert.match(boardPageSource, /OPERATIONS_TOOL_URL/);
  assert.match(boardPageSource, /운영툴 이동/);
  assert.match(boardPageSource, /target="_blank"/);
  assert.match(boardPageSource, /rel="noopener noreferrer"/);
});
