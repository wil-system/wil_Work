import test from 'node:test';
import assert from 'node:assert/strict';
import { getTotalPages, getVisiblePageNumbers, parsePageParam } from '../lib/pagination.ts';

test('parses page params into positive integer pages', () => {
  assert.equal(parsePageParam(undefined), 1);
  assert.equal(parsePageParam(''), 1);
  assert.equal(parsePageParam('0'), 1);
  assert.equal(parsePageParam('-3'), 1);
  assert.equal(parsePageParam('2.8'), 2);
  assert.equal(parsePageParam('4'), 4);
});

test('calculates total pages with a minimum of one', () => {
  assert.equal(getTotalPages(0, 15), 1);
  assert.equal(getTotalPages(1, 15), 1);
  assert.equal(getTotalPages(15, 15), 1);
  assert.equal(getTotalPages(16, 15), 2);
});

test('keeps first last current and nearby page numbers visible', () => {
  assert.deepEqual(getVisiblePageNumbers(1, 1), [1]);
  assert.deepEqual(getVisiblePageNumbers(1, 5), [1, 2, 3, 5]);
  assert.deepEqual(getVisiblePageNumbers(5, 10), [1, 3, 4, 5, 6, 7, 10]);
  assert.deepEqual(getVisiblePageNumbers(10, 10), [1, 8, 9, 10]);
});
