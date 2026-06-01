import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateReportChangeSummary, normalizeReportItems } from '../lib/report-diff.ts';

test('normalizes report items from newline text and arrays', () => {
  assert.deepEqual(normalizeReportItems('  신규 고객 미팅\n\n제안서 발송  '), [
    '신규 고객 미팅',
    '제안서 발송',
  ]);

  assert.deepEqual(normalizeReportItems([' 일정 조율 ', '', '계약서 검토']), [
    '일정 조율',
    '계약서 검토',
  ]);
});

test('calculates added completed carried and dropped changes against the previous report', () => {
  const summary = calculateReportChangeSummary({
    previous: {
      goals: ['A 고객 제안', 'B 업체 미팅'],
      progress: ['기존 운영 점검'],
      nextPlan: ['신규 캠페인 준비', '계약서 검토'],
    },
    current: {
      goals: ['신규 캠페인 준비', 'C 고객 미팅'],
      progress: ['A 고객 제안', '계약서 검토'],
      nextPlan: ['B 업체 미팅', 'C 고객 미팅'],
    },
  });

  assert.deepEqual(summary.added, ['C 고객 미팅']);
  assert.deepEqual(summary.completed, ['A 고객 제안', '계약서 검토']);
  assert.deepEqual(summary.carried, ['B 업체 미팅', '신규 캠페인 준비']);
  assert.deepEqual(summary.dropped, []);
});

test('treats a missing previous report as all current planned work added', () => {
  const summary = calculateReportChangeSummary({
    previous: null,
    current: {
      goals: ['목표 1'],
      progress: ['진행 1'],
      nextPlan: ['계획 1'],
    },
  });

  assert.deepEqual(summary.added, ['목표 1', '진행 1', '계획 1']);
  assert.deepEqual(summary.completed, []);
  assert.deepEqual(summary.carried, []);
  assert.deepEqual(summary.dropped, []);
});
