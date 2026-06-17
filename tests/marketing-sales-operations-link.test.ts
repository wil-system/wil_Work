import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { OPERATIONS_TOOL_URL, shouldShowOperationsToolLink } from '../lib/board-operations-link.ts';

test('shows the operations tool link only for the marketing sales board name', () => {
  assert.equal(OPERATIONS_TOOL_URL, 'https://wil-system.vercel.app');
  assert.equal(shouldShowOperationsToolLink({ name: '마케팅/영업' }), true);
  assert.equal(shouldShowOperationsToolLink({ name: ' 마케팅 / 영업 ' }), true);
  assert.equal(shouldShowOperationsToolLink({ name: '마케팅' }), false);
  assert.equal(shouldShowOperationsToolLink({ name: '영업팀' }), false);
});

test('board page renders the operations tool link from the marketing sales predicate', () => {
  const boardPageSource = readFileSync(resolve('app/(workspace)/board/[boardId]/page.tsx'), 'utf8');

  assert.match(boardPageSource, /shouldShowOperationsToolLink\(board\)/);
  assert.match(boardPageSource, /OPERATIONS_TOOL_URL/);
  assert.match(boardPageSource, /actions=\{showOperationsToolLink \? \(/);
  assert.match(boardPageSource, /target="_blank"/);
  assert.match(boardPageSource, /rel="noopener noreferrer"/);
  assert.equal(boardPageSource.includes('flex-shrink-0 border-b bg-white px-3 py-2 sm:px-6'), false);
});

test('topbar renders custom actions immediately before the notification icon', () => {
  const topbarSource = readFileSync(resolve('components/topbar.tsx'), 'utf8');

  assert.match(topbarSource, /actions\?: ReactNode;/);
  assert.match(topbarSource, /\{actions && \(/);
  assert.ok(
    topbarSource.indexOf('{actions && (') < topbarSource.indexOf('href="/notifications"'),
    'custom topbar actions should render to the left of the notification link',
  );
});

test('topbar keeps notifications but does not expose a profile edit link', () => {
  const topbarSource = readFileSync(resolve('components/topbar.tsx'), 'utf8');

  assert.match(topbarSource, /href="\/notifications"/);
  assert.equal(topbarSource.includes('href="/profile"'), false);
  assert.equal(topbarSource.includes('currentUser.name'), false);
});
