import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getRegisterErrorMessage } from '../lib/register-auth-errors.ts';

test('maps signup email rate limit errors to a specific message', () => {
  assert.equal(
    getRegisterErrorMessage({
      status: 429,
      code: 'over_email_send_rate_limit',
      message: 'email rate limit exceeded',
    }),
    '인증 이메일 발송 제한에 걸렸습니다. 잠시 후 다시 시도해 주세요.',
  );
});

test('maps duplicate email signup errors to a specific message', () => {
  assert.equal(
    getRegisterErrorMessage({ message: 'User already registered' }),
    '이미 등록된 이메일입니다.',
  );
});

test('maps missing admin signup credentials to a specific message', () => {
  assert.equal(
    getRegisterErrorMessage({ message: 'Supabase admin credentials are not configured.' }),
    '가입 신청을 처리할 서버 관리자 키가 설정되지 않았습니다.',
  );
});

test('keeps unknown signup errors generic', () => {
  assert.equal(
    getRegisterErrorMessage({ message: 'Unexpected auth failure' }),
    '가입 신청 중 오류가 발생했습니다.',
  );
});
