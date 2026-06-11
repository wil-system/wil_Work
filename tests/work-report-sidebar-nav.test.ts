import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('always exposes the work report write nav item for approved workspace users', () => {
  const layoutSource = readFileSync(resolve('app/(workspace)/layout.tsx'), 'utf8');
  const sidebarSource = readFileSync(resolve('components/board-sidebar.tsx'), 'utf8');
  const writePageSource = readFileSync(resolve('app/(workspace)/work-report/page.tsx'), 'utf8');

  assert.equal(layoutSource.includes('reportBoardCount'), false);
  assert.match(layoutSource, /const canWriteWorkReport = true;/);
  assert.match(sidebarSource, /label="업무보고 작성"/);
  assert.match(sidebarSource, /href="\/work-report\?mode=write"/);
  assert.equal(
    writePageSource.includes('부서와 기간을 선택해 목표, 진행업무, 이슈사항, 다음계획을 제출합니다'),
    false,
  );
});

test('work report sidebar links close the mobile menu after selection', () => {
  const sidebarSource = readFileSync(resolve('components/board-sidebar.tsx'), 'utf8');
  const writeNav = sidebarSource.match(/<NavItem\s*\r?\n\s*href="\/work-report\?mode=write"[\s\S]*?\/>/)?.[0] ?? '';
  const reviewNav = sidebarSource.match(/<NavItem\s*\r?\n\s*href="\/work-report\/review"[\s\S]*?\/>/)?.[0] ?? '';

  assert.match(writeNav, /onSelect=\{close\}/);
  assert.match(reviewNav, /onSelect=\{close\}/);
});
