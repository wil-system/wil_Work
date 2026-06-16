export function getClientErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error !== null) {
    const record = error as Record<string, unknown>;
    const parts = ['message', 'details', 'hint']
      .map(key => record[key])
      .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);

    if (parts.length > 0) return parts.join(' ');

    if (typeof record.code === 'string' && record.code.trim()) {
      return `오류 코드: ${record.code}`;
    }
  }

  if (typeof error === 'string' && error.trim()) return error;

  return '알 수 없는 오류';
}
