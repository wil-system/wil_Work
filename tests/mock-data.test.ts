import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHighVolumeMockData,
  isHighVolumeDemoDataMode,
} from '../lib/mock-data.ts';

test('recognizes high volume demo data mode values', () => {
  assert.equal(isHighVolumeDemoDataMode('heavy'), true);
  assert.equal(isHighVolumeDemoDataMode('large'), true);
  assert.equal(isHighVolumeDemoDataMode('true'), true);
  assert.equal(isHighVolumeDemoDataMode('normal'), false);
  assert.equal(isHighVolumeDemoDataMode(undefined), false);
});

test('builds dense demo data for every mock-backed page', () => {
  const data = buildHighVolumeMockData();
  const currentUserReports = data.workReports.filter(report => report.authorId === 'u1');

  assert.ok(data.profiles.length >= 40);
  assert.ok(data.profiles.filter(profile => profile.status === 'pending').length >= 6);
  assert.ok(data.boardPermissions.length >= 60);
  assert.ok(data.posts.length >= 90);
  assert.ok(new Set(data.posts.map(post => post.boardId)).size >= 5);
  assert.ok(data.posts.some(post => post.workStatus));
  assert.ok(data.workReports.length >= 70);
  assert.ok(currentUserReports.length >= 50);
  assert.ok(currentUserReports.some(report => report.id.startsWith('hv-my-report-')));
  assert.ok(data.memos.length >= 40);
  assert.ok(data.notifications.length >= 60);
  assert.ok(data.notifications.some(notification => !notification.isRead));
});

test('builds a dense today calendar scenario with separate schedules and todos', () => {
  const data = buildHighVolumeMockData();
  const todayItems = data.calendarEvents.filter(item => item.date === '2026-06-10');
  const todaySchedules = todayItems.filter(item => item.type !== 'todo');
  const todayTodos = todayItems.filter(item => item.type === 'todo');

  assert.ok(todaySchedules.length >= 14);
  assert.ok(todayTodos.length >= 18);
  assert.ok(todayTodos.some(item => item.completed));
  assert.ok(todayTodos.every(item => item.todoColor));
});
