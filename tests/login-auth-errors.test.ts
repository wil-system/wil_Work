import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getLoginErrorMessage } from '../lib/login-auth-errors.ts';

test('maps unconfirmed email login errors to a specific message', () => {
  assert.equal(
    getLoginErrorMessage({ code: 'email_not_confirmed', message: 'Email not confirmed' }),
    '이메일 확인이 완료되지 않았습니다. 관리자에게 문의해 주세요.',
  );

  assert.equal(
    getLoginErrorMessage({ message: 'Email not confirmed' }),
    '이메일 확인이 완료되지 않았습니다. 관리자에게 문의해 주세요.',
  );
});

test('keeps invalid credentials generic', () => {
  assert.equal(
    getLoginErrorMessage({ code: 'invalid_credentials', message: 'Invalid login credentials' }),
    '이메일 또는 비밀번호가 올바르지 않습니다.',
  );
});
