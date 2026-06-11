export function getLoginErrorMessage(error: { code?: string; message?: string } | null | undefined) {
  const code = error?.code?.toLowerCase() ?? '';
  const message = error?.message?.toLowerCase() ?? '';

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return '이메일 확인이 완료되지 않았습니다. 관리자에게 문의해 주세요.';
  }

  return '이메일 또는 비밀번호가 올바르지 않습니다.';
}
