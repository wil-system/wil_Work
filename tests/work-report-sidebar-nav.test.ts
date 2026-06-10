import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('always exposes the work report write nav item for approved workspace users', () => {
  const layoutSource = readFileSync(resolve('app/(workspace)/layout.tsx'), 'utf8');
  const sidebarSource = readFileSync(resolve('components/board-sidebar.tsx'), 'utf8');

  assert.equal(layoutSource.includes('reportBoardCount'), false);
  assert.match(layoutSource, /const canWriteWorkReport = true;/);
  assert.match(sidebarSource, /label="업무보고 작성"/);
  assert.match(sidebarSource, /href="\/work-report\?mode=write"/);
});
