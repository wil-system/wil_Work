import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

function mentionFunction(sql: string) {
  const match = sql.match(/create or replace function public\.create_feed_mention_notifications[\s\S]*?\n\$\$;/i);
  assert.ok(match, 'mention notification function should exist');
  return match[0];
}

test('mention notifications support feed and board post links', () => {
  const fn = mentionFunction(read('supabase/schema.sql'));

  assert.match(fn, /post\.board_id/i);
  assert.match(fn, /left join public\.work_boards/i);
  assert.match(fn, /when v_board_id = 'feed' then '\/feed\?post='/i);
  assert.match(fn, /else '\/board\/' \|\| v_board_id \|\| '\?post='/i);
  assert.equal(fn.includes("and board_id = 'feed'"), false);
});

test('latest migration repairs mention notifications for all boards', () => {
  const migration = read('supabase/migrations/20260616121000_board_mention_notifications.sql');
  const fn = mentionFunction(migration);

  assert.match(fn, /post\.board_id/i);
  assert.equal(fn.includes("and board_id = 'feed'"), false);
});
