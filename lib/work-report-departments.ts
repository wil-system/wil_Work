import type { Profile } from './types';

export const UNASSIGNED_WORK_REPORT_DEPARTMENT_LABEL = '부서 미지정';

export function normalizeWorkReportDepartment(value?: string | null) {
  return value?.trim() ?? '';
}

export function getWorkReportDepartmentOptions(
  profiles: Array<Pick<Profile, 'department' | 'status'>>,
) {
  const departments = new Set<string>();

  for (const profile of profiles) {
    if (profile.status !== 'approved') continue;
    const department = normalizeWorkReportDepartment(profile.department);
    if (department) departments.add(department);
  }

  return [...departments].sort((a, b) => a.localeCompare(b, 'ko'));
}

export function getWorkReportDepartmentLabel(
  department?: string | null,
  fallbackDepartment?: string | null,
) {
  return normalizeWorkReportDepartment(department) ||
    normalizeWorkReportDepartment(fallbackDepartment) ||
    UNASSIGNED_WORK_REPORT_DEPARTMENT_LABEL;
}
