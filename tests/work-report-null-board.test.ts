import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

test('work report form allows submitting without a department board', () => {
  const formSource = read('components/work-report-form.tsx');

  assert.equal(formSource.includes('name="department"'), false);
  assert.equal(formSource.includes('departmentOptions'), false);
  assert.equal(formSource.includes('보고서를 작성할 수 있는 부서 권한이 없습니다.'), false);
});

test('work report persistence stores missing board ids as null without department payloads', () => {
  const reportDbSource = read('lib/db/reports.ts');
  const actionSource = read('app/(workspace)/work-report/actions.ts');

  assert.match(actionSource, /boardId:\s*boardId\s*\|\|\s*undefined/);
  assert.equal(actionSource.includes('department:'), false);
  assert.equal(reportDbSource.includes('department:'), false);
  assert.match(reportDbSource, /board_id:\s*report\.boardId\s*\?\?\s*null/);
  assert.equal(reportDbSource.includes("?? 'feed'"), false);
});
