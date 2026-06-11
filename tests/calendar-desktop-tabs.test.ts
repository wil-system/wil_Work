import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

test('desktop calendar right rail uses tabs for schedule and todo lists', () => {
  const source = read('components/calendar-client.tsx');

  assert.match(source, /data-calendar-desktop-tab=\{section\}/);
  assert.match(source, /desktopListTab === 'event'/);
  assert.match(source, /desktopListTab === 'todo'/);
  assert.equal(source.includes('grid-rows-2'), false);
});
