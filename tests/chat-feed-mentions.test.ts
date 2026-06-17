import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readChatFeed() {
  return readFileSync(resolve('components/chat-feed.tsx'), 'utf8');
}

test('mention suggestions are not capped before all people can be shown', () => {
  const source = readChatFeed();
  const mentionOptionsBlock = source.match(/const mentionOptions:[\s\S]*?const existingHashtags/)?.[0] ?? '';

  assert.notEqual(mentionOptionsBlock, '');
  assert.equal(mentionOptionsBlock.includes('.slice(0, 8)'), false);
});

test('composer option keyboard navigation uses the active option list length', () => {
  const source = readChatFeed();

  assert.equal(source.includes('% mentionOptions.length'), false);
  assert.match(source, /% composerOptions\.length/);
});
