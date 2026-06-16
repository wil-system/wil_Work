import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

test('feed and card comments render mention and hashtag rich text', () => {
  const chatFeed = read('components/chat-feed.tsx');
  const postCard = read('components/post-card.tsx');

  assert.match(chatFeed, /renderRichText\(c\.content\)/);
  assert.match(postCard, /renderRichText\(c\.content\)/);
});
