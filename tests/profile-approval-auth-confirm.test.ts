import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('approving a profile also confirms the Supabase Auth email', () => {
  const source = read('lib/db/profiles.ts');

  assert.match(source, /createAdminClient/);
  assert.match(source, /if \(status === 'approved'\)/);
  assert.match(source, /auth\.admin\.updateUserById\(\s*id,\s*\{\s*email_confirm:\s*true\s*\}/s);
});

test('Supabase admin client uses only the service role key', () => {
  const source = read('lib/supabase/admin.ts');

  assert.match(source, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.equal(source.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY'), false);
});
