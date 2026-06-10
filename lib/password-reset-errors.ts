const SAME_PASSWORD_MESSAGE = '기존 비밀번호와 다른 새 비밀번호를 입력하세요.';
const RESET_LINK_MESSAGE = '재설정 링크가 만료되었거나 유효하지 않습니다. 재설정 메일을 다시 요청하세요.';
const WEAK_PASSWORD_MESSAGE = '더 안전한 새 비밀번호를 입력하세요.';
const GENERIC_MESSAGE = '비밀번호 변경에 실패했습니다. 잠시 후 다시 시도하세요.';

const resetSessionErrorCodes = new Set([
  'session_not_found',
  'session_expired',
  'refresh_token_not_found',
  'refresh_token_already_used',
  'otp_expired',
  'flow_state_not_found',
  'flow_state_expired',
]);

function getErrorField(error: unknown, field: 'code' | 'message' | 'name'): string {
  if (!error || typeof error !== 'object') return '';
  const value = (error as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : '';
}

export function getPasswordResetUpdateErrorMessage(error: unknown): string {
  const code = getErrorField(error, 'code').toLowerCase();
  const message = getErrorField(error, 'message').toLowerCase();
  const name = getErrorField(error, 'name');

  if (
    code === 'same_password' ||
    message.includes('same_password') ||
    message.includes('same password') ||
    (message.includes('different') && message.includes('old password'))
  ) {
    return SAME_PASSWORD_MESSAGE;
  }

  if (code === 'weak_password') {
    return WEAK_PASSWORD_MESSAGE;
  }

  if (resetSessionErrorCodes.has(code) || name === 'AuthSessionMissingError') {
    return RESET_LINK_MESSAGE;
  }

  return GENERIC_MESSAGE;
}
