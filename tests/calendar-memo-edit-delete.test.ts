import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function read(path: string) {
  return readFileSync(resolve(path), 'utf8');
}

test('calendar items expose edit and delete flows from the edit icon', () => {
  const client = read('components/calendar-client.tsx');
  const actions = read('app/(workspace)/calendar/actions.ts');

  assert.match(client, /import \{ createEvent, deleteEvent, updateEvent, updateTodoCompletion \}/);
  assert.match(client, /onEditTodo: \(todo: CalendarEvent\) => void/);
  assert.match(client, /<Edit3 size=\{13\} \/>/);
  assert.match(client, /editingEvent && <input type="hidden" name="id" value=\{editingEvent\.id\} \/>/);
  assert.match(client, /defaultValue=\{editingEvent\?\.title \?\? ''\}/);
  assert.match(client, /deleteEvent\(editingEvent\.id\)/);
  assert.match(client, /<Trash2 size=\{14\} \/>/);

  assert.match(actions, /export async function updateEvent/);
  assert.match(actions, /export async function deleteEvent/);
  assert.match(actions, /\.eq\('created_by', user\.id\)/);
  assert.match(actions, /getTodoDescriptionMeta/);
});

test('memo edit modal can delete the selected memo', () => {
  const panel = read('components/memo-panel.tsx');
  const actions = read('app/(workspace)/memo/actions.ts');
  const db = read('lib/db/memos.ts');

  assert.match(panel, /import \{ saveMemo, deleteMemo \}/);
  assert.match(panel, /async function handleDelete/);
  assert.match(panel, /deleteMemo\(editingMemo\.id\)/);
  assert.match(panel, /<Trash2 size=\{14\} \/>/);

  assert.match(actions, /export async function deleteMemo/);
  assert.match(actions, /deleteMemoById\(id, user\.id\)/);
  assert.match(db, /export async function deleteMemoById/);
  assert.match(db, /\.delete\(\)/);
  assert.match(db, /\.eq\('author_id', authorId\)/);
});
