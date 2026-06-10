import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('does not show the old report review hierarchy helper copy', () => {
  const oldCopy = '\ud300\uc6d0\u0020\ubcf4\uace0\ub294\u0020\ud300\uc7a5\uc774\u002c\u0020\ud300\uc7a5\u0020\ubcf4\uace0\ub294\u0020\uad00\ub9ac\uc790\uac00\u0020\uac80\ud1a0\ud569\ub2c8\ub2e4';
  const pageSource = readFileSync(
    resolve('app/(workspace)/work-report/review/page.tsx'),
    'utf8',
  );

  assert.equal(pageSource.includes(oldCopy), false);
});
