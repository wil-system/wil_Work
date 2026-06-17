import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('work report review filters do not expose profile department choices', () => {
  const pageSource = readFileSync(resolve('app/(workspace)/work-report/review/page.tsx'), 'utf8');

  assert.equal(pageSource.includes('name="department"'), false);
  assert.equal(pageSource.includes('전체 부서'), false);
  assert.equal(pageSource.includes('profile.department === department'), false);
});

test('work report review filters keep the status dropdown without quick status shortcuts', () => {
  const pageSource = readFileSync(resolve('app/(workspace)/work-report/review/page.tsx'), 'utf8');

  assert.match(pageSource, /<select name="status"[\s\S]*<option value="">전체 상태<\/option>/);
  assert.doesNotMatch(
    pageSource,
    /href=\{buildReviewHref\(currentParams,\s*\{\s*status: reviewStatus === status \? undefined : status,\s*page: 1\s*\}\)\}/,
  );
});
