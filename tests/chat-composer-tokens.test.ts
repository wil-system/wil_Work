import test from 'node:test';
import assert from 'node:assert/strict';
import {
  extractHashtags,
  getActiveComposerToken,
  insertComposerToken,
} from '../lib/chat-composer-tokens.ts';

test('detects active mention and hashtag composer tokens', () => {
  assert.deepEqual(getActiveComposerToken('@김', 2), {
    trigger: '@',
    query: '김',
    start: 0,
    end: 2,
  });
  assert.deepEqual(getActiveComposerToken('확인 #계약', 6), {
    trigger: '#',
    query: '계약',
    start: 3,
    end: 6,
  });
  assert.equal(getActiveComposerToken('email@test.com', 14), null);
});

test('inserts selected mention and hashtag tokens with spacing', () => {
  assert.deepEqual(insertComposerToken('확인 @김', { trigger: '@', query: '김', start: 3, end: 5 }, '김보현'), {
    value: '확인 @김보현 ',
    cursor: 8,
  });
  assert.deepEqual(insertComposerToken('확인 #계', { trigger: '#', query: '계', start: 3, end: 5 }, '계약'), {
    value: '확인 #계약 ',
    cursor: 7,
  });
});

test('extracts unique hashtags from existing feed content', () => {
  assert.deepEqual(
    extractHashtags(['#계약 공유 #계약', '다음 #마케팅, 확인', '이메일 test@example.com']),
    ['계약', '마케팅'],
  );
});
