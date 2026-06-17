import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('opens the work report entry nav on my report history first', () => {
  const layoutSource = readFileSync(resolve('app/(workspace)/layout.tsx'), 'utf8');
  const sidebarSource = readFileSync(resolve('components/board-sidebar.tsx'), 'utf8');
  const writePageSource = readFileSync(resolve('app/(workspace)/work-report/page.tsx'), 'utf8');

  assert.equal(layoutSource.includes('reportBoardCount'), false);
  assert.match(layoutSource, /const canWriteWorkReport = true;/);
  assert.match(sidebarSource, /label="업무보고 작성"/);
  assert.match(sidebarSource, /href="\/work-report"/);
  assert.equal(sidebarSource.includes('href="/work-report?mode=write"'), false);
  assert.match(writePageSource, /const isWriting = one\(params\.mode\) === 'write';/);
  assert.match(writePageSource, /href="\/work-report\?mode=write"/);
  assert.equal(
    writePageSource.includes('부서와 기간을 선택해 목표, 진행업무, 이슈사항, 다음계획을 제출합니다'),
    false,
  );
});

test('work report sidebar links close the mobile menu after selection', () => {
  const sidebarSource = readFileSync(resolve('components/board-sidebar.tsx'), 'utf8');
  const writeNav = sidebarSource.match(/<NavItem\s*\r?\n\s*href="\/work-report"[\s\S]*?\/>/)?.[0] ?? '';
  const reviewNav = sidebarSource.match(/<NavItem\s*\r?\n\s*href="\/work-report\/review"[\s\S]*?\/>/)?.[0] ?? '';

  assert.match(writeNav, /onSelect=\{close\}/);
  assert.match(reviewNav, /onSelect=\{close\}/);
});

test('my report history does not show a review shortcut banner', () => {
  const writePageSource = readFileSync(resolve('app/(workspace)/work-report/page.tsx'), 'utf8');

  assert.equal(writePageSource.includes('검토 항목으로 이동'), false);
});

test('work report write screen does not show a review items button', () => {
  const writePageSource = readFileSync(resolve('app/(workspace)/work-report/page.tsx'), 'utf8');
  const writeScreenBlock = writePageSource.match(/\{isWriting \? \([\s\S]*?\) : \(/)?.[0] ?? '';

  assert.notEqual(writeScreenBlock, '');
  assert.equal(writeScreenBlock.includes('href="/work-report/review"'), false);
  assert.equal(writeScreenBlock.includes('ClipboardCheck'), false);
});

test('sidebar brand opens the main feed', () => {
  const sidebarSource = readFileSync(resolve('components/board-sidebar.tsx'), 'utf8');
  const brandBlock = sidebarSource.match(/<Link\s+href="\/feed"[\s\S]*?W·I·L[\s\S]*?<\/Link>/)?.[0] ?? '';

  assert.notEqual(brandBlock, '');
  assert.match(brandBlock, /onClick=\{close\}/);
});

test('sidebar does not expose notification and settings menu links', () => {
  const sidebarSource = readFileSync(resolve('components/board-sidebar.tsx'), 'utf8');

  assert.equal(sidebarSource.includes('href="/notifications"'), false);
  assert.equal(sidebarSource.includes('label="알림"'), false);
  assert.equal(sidebarSource.includes('href="/settings"'), false);
  assert.equal(sidebarSource.includes('label="설정"'), false);
});
