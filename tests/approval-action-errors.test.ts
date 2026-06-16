import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('approval actions redirect back with a visible error instead of throwing to the Next error page', () => {
  const source = read('app/(workspace)/admin/approvals/page.tsx');

  assert.match(source, /catch \(error\)/);
  assert.match(source, /approvalError/);
  assert.match(source, /redirect\(`\/admin\/approvals\?/);
  assert.match(source, /role="alert"/);
});

test('environment example documents the service role key required by approval', () => {
  const source = read('.env.example');

  assert.match(source, /^SUPABASE_SERVICE_ROLE_KEY=/m);
});
