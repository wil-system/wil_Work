import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWorkReportDepartmentLabel,
  getWorkReportDepartmentOptions,
  UNASSIGNED_WORK_REPORT_DEPARTMENT_LABEL,
} from '../lib/work-report-departments.ts';
import type { Profile } from '../lib/types.ts';

function profile(department: string, status: Profile['status'] = 'approved'): Pick<Profile, 'department' | 'status'> {
  return { department, status };
}

test('builds work report department choices from approved member profile departments', () => {
  assert.deepEqual(
    getWorkReportDepartmentOptions([
      profile(' 영업팀 '),
      profile('경영지원'),
      profile('영업팀'),
      profile(''),
      profile('테스트', 'pending'),
    ]),
    ['경영지원', '영업팀'],
  );
});

test('labels saved report departments before falling back to unassigned', () => {
  assert.equal(getWorkReportDepartmentLabel(' 영업팀 '), '영업팀');
  assert.equal(getWorkReportDepartmentLabel(''), UNASSIGNED_WORK_REPORT_DEPARTMENT_LABEL);
  assert.equal(getWorkReportDepartmentLabel(undefined), UNASSIGNED_WORK_REPORT_DEPARTMENT_LABEL);
});
