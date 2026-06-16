type RegisterAuthError = {
  code?: string;
  message?: string;
  status?: number;
};

function asRegisterAuthError(error: unknown): RegisterAuthError {
  if (!error || typeof error !== 'object') return {};
  const record = error as Record<string, unknown>;

  return {
    code: typeof record.code === 'string' ? record.code : undefined,
    message: typeof record.message === 'string' ? record.message : undefined,
    status: typeof record.status === 'number' ? record.status : undefined,
  };
}

export function getRegisterErrorMessage(error: unknown) {
  const authError = asRegisterAuthError(error);
  const code = authError.code?.toLowerCase() ?? '';
  const message = authError.message?.toLowerCase() ?? '';

  if (message.includes('supabase admin credentials are not configured')) {
    return '가입 신청을 처리할 서버 관리자 키가 설정되지 않았습니다.';
  }

  if (authError.status === 429 || code.includes('rate_limit') || message.includes('rate limit')) {
    return '인증 이메일 발송 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.';
  }

  if (
    code.includes('user_already') ||
    message.includes('already registered') ||
    message.includes('already exists')
  ) {
    return '이미 등록된 이메일입니다.';
  }

  if (code.includes('weak_password') || message.includes('password')) {
    return '비밀번호 조건을 확인해 주세요.';
  }

  if (code.includes('invalid_email') || message.includes('invalid email')) {
    return '이메일 주소를 확인해 주세요.';
  }

  if (message.includes('database error saving new user')) {
    return '회원 정보 저장 중 오류가 발생했습니다. 관리자에게 문의해 주세요.';
  }

  return '가입 신청 중 오류가 발생했습니다.';
}
