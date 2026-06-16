import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getClientErrorMessage } from '../lib/client-error-message.ts';

test('full feed post insert omits business-only columns unless task mode is active', () => {
  const source = readFileSync('components/chat-feed.tsx', 'utf8');
  const insertBuildStart = source.indexOf('const postInsert:');
  const insertCall = source.indexOf('.insert(postInsert)');
  const sendStart = source.indexOf('async function handleSend');
  const saveSlice = source.slice(sendStart, source.indexOf('const postId', sendStart));
  const taskBlock = source.slice(source.indexOf('if (isBusiness && taskMode)'), insertCall);

  assert.ok(insertBuildStart > -1, 'chat feed should build a post insert payload before sending');
  assert.ok(insertCall > insertBuildStart, 'chat feed should insert the prepared payload');
  assert.match(taskBlock, /postInsert\.work_status = 'in_progress'/);
  assert.match(taskBlock, /postInsert\.is_pinned = true/);
  assert.match(taskBlock, /postInsert\.assignee_id = taskAssigneeId/);
  assert.equal(saveSlice.includes('.insert({'), false);
});

test('client error formatter reads Supabase plain error objects', () => {
  assert.equal(
    getClientErrorMessage({
      message: 'new row violates row-level security policy',
      details: 'Failing row contains ...',
      hint: 'Check approval status',
    }),
    'new row violates row-level security policy Failing row contains ... Check approval status',
  );
  assert.equal(getClientErrorMessage({ code: 'PGRST204' }), '오류 코드: PGRST204');
  assert.equal(getClientErrorMessage(null), '알 수 없는 오류');
});
