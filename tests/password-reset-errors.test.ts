import test from 'node:test';
import assert from 'node:assert/strict';
import { getPasswordResetUpdateErrorMessage } from '../lib/password-reset-errors.ts';

test('shows a specific message when the new password matches the current password', () => {
  const message = getPasswordResetUpdateErrorMessage({
    code: 'same_password',
    message: 'New password should be different from the old password.',
    status: 422,
  });

  assert.equal(message, '기존 비밀번호와 다른 새 비밀번호를 입력하세요.');
});

test('still shows reset-link guidance for missing or expired reset sessions', () => {
  assert.equal(
    getPasswordResetUpdateErrorMessage({ code: 'session_not_found' }),
    '재설정 링크가 만료되었거나 유효하지 않습니다. 재설정 메일을 다시 요청하세요.',
  );
  assert.equal(
    getPasswordResetUpdateErrorMessage({ name: 'AuthSessionMissingError' }),
    '재설정 링크가 만료되었거나 유효하지 않습니다. 재설정 메일을 다시 요청하세요.',
  );
});
