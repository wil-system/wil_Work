import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('workspace topbars do not render title subtitles', () => {
  const topbarSources = [
    'app/(workspace)/feed/page.tsx',
    'app/(workspace)/board/[boardId]/page.tsx',
    'app/(workspace)/calendar/page.tsx',
    'app/(workspace)/memo/page.tsx',
    'app/(workspace)/notifications/page.tsx',
    'app/(workspace)/work-report/page.tsx',
    'app/(workspace)/admin/approvals/page.tsx',
    'app/(workspace)/admin/boards/page.tsx',
    'app/(workspace)/admin/members/page.tsx',
    'app/(workspace)/admin/permissions/page.tsx',
  ];

  for (const sourcePath of topbarSources) {
    const source = read(sourcePath);
    assert.equal(
      source.includes('subtitle='),
      false,
      `${sourcePath} should not pass a subtitle to Topbar`,
    );
  }
});

test('removed page subtitle copy does not remain in page sources', () => {
  const workspaceSource = [
    'app/(workspace)/feed/page.tsx',
    'app/(workspace)/board/[boardId]/page.tsx',
    'app/(workspace)/calendar/page.tsx',
    'app/(workspace)/memo/page.tsx',
    'app/(workspace)/admin/approvals/page.tsx',
    'app/(workspace)/admin/boards/page.tsx',
    'app/(workspace)/admin/members/page.tsx',
    'app/(workspace)/admin/permissions/page.tsx',
  ].map(read).join('\n');

  for (const copy of [
    'WIL 팀 채팅',
    '전사 공지',
    '일정을 관리하세요',
    '나만의 업무 메모를 관리하세요',
    '승인 대기 중인 신청',
    '전체 회원',
    '게시판별 접근 허용과 직급을 지정합니다',
    '게시판을 추가하고 설정하세요',
  ]) {
    assert.equal(workspaceSource.includes(copy), false, `${copy} should be removed`);
  }
});
