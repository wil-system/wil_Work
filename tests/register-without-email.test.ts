import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('registration uses the server admin createUser path instead of client signUp', () => {
  const pageSource = read('app/(auth)/register/page.tsx');
  const actionSource = read('app/(auth)/register/actions.ts');

  assert.equal(pageSource.includes('auth.signUp'), false);
  assert.equal(pageSource.includes('@/lib/supabase/client'), false);
  assert.match(pageSource, /registerUser\(new FormData\(e\.currentTarget\)\)/);
  assert.match(actionSource, /createAdminClient/);
  assert.match(actionSource, /auth\.admin\.createUser/);
  assert.match(actionSource, /email_confirm:\s*true/);
  assert.match(actionSource, /user_metadata:\s*\{/);
});
