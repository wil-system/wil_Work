import test from 'node:test';
import assert from 'node:assert/strict';
import { generateBoardId } from '../lib/board-id.ts';

test('generates an internal board id without requiring admin input', () => {
  assert.equal(generateBoardId('A3D1-44FF-8899-TEST'), 'board-a3d144ff8899');
});

test('falls back to a safe internal board id when the seed has no usable characters', () => {
  assert.match(generateBoardId('---'), /^board-[a-z0-9]+$/);
});
