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

test('selected feed calendar dates share the same empty message copy', () => {
  const source = readFileSync('components/chat-feed.tsx', 'utf8');

  assert.match(source, /anchorDate \? '해당 날짜에 메시지가 없습니다' : '아직 메시지가 없습니다'/);
  assert.match(source, /anchorDate \? '오른쪽 캘린더에서 다른 날짜를 선택하세요' : '첫 메시지를 입력해 대화를 시작해보세요'/);
  assert.equal(source.includes('해당 날짜 이후의 메시지가 없습니다'), false);
});

test('selected feed calendar date loads only that day', () => {
  const component = readFileSync('components/chat-feed.tsx', 'utf8');
  const actions = readFileSync('app/(workspace)/feed/actions.ts', 'utf8');
  const postsDb = readFileSync('lib/db/posts.ts', 'utf8');
  const nextFromSelectedStart = component.indexOf('async function loadNextFromSelectedDate');
  const nextFromSelectedEnd = component.indexOf('function updateActiveDateFromScroll');
  const loadNextFromSelectedDate = component.slice(nextFromSelectedStart, nextFromSelectedEnd);
  const selectDateStart = component.indexOf('async function handleSelectDate');
  const selectDateEnd = component.indexOf('function handleClearDate');
  const handleSelectDate = component.slice(selectDateStart, selectDateEnd);

  assert.ok(nextFromSelectedStart > -1, 'selected date pagination handler should exist');
  assert.ok(selectDateStart > -1, 'calendar date selection handler should exist');
  assert.match(loadNextFromSelectedDate, /loadFeedPostsOnDate\(anchorDate, posts\[posts\.length - 1\]\.createdAt, boardId\)/);
  assert.equal(loadNextFromSelectedDate.includes('loadFeedPostsFromDate(anchorDate'), false);
  assert.match(handleSelectDate, /loadFeedPostsOnDate\(date, undefined, boardId\)/);
  assert.equal(handleSelectDate.includes('loadFeedPostsFromDate(date, undefined, boardId)'), false);
  assert.match(component, /aria-label=\{`\$\{day\.key\} 보기, 글 \$\{count\}개`\}/);
  assert.equal(component.includes('부터 보기, 글'), false);
  assert.match(actions, /export async function loadFeedPostsOnDate\(date: string, afterCreatedAt\?: string, boardId = 'feed'\): Promise<FeedPostPage> \{\s+return getBoardPostsOnDate\(boardId, date, afterCreatedAt, 20\);/);
  assert.match(postsDb, /export async function getBoardPostsOnDate/);
  assert.match(postsDb, /\.gte\('created_at', start\)/);
  assert.match(postsDb, /\.lt\('created_at', end\)/);
});
