'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, KeyRound, ShieldCheck } from 'lucide-react';
import { getPasswordResetUpdateErrorMessage } from '@/lib/password-reset-errors';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [validSession, setValidSession] = useState(false);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setValidSession(Boolean(data.user));
      setReady(true);
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      setError('비밀번호 확인이 일치하지 않습니다.');
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(getPasswordResetUpdateErrorMessage(updateError));
      return;
    }

    await supabase.auth.signOut();
    setSuccess(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-1">W · I · L</div>
          <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase">Workspace</div>
        </div>
        <div className="card p-7">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--indigo-50)] text-[var(--indigo-600)]">
            {success ? <ShieldCheck size={21} /> : <KeyRound size={21} />}
          </div>
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">새 비밀번호 설정</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6 leading-relaxed">
            재설정 링크가 확인되면 새 비밀번호를 저장할 수 있습니다.
          </p>

          {!ready ? (
            <div className="rounded-lg border px-3 py-3 text-[12px] text-[var(--muted)]" style={{ borderColor: 'var(--line)' }}>
              재설정 링크를 확인하는 중입니다.
            </div>
          ) : success ? (
            <div className="space-y-5">
              <div className="rounded-lg border bg-[var(--stone-50)] px-3 py-3 text-[12px] leading-relaxed text-[var(--stone-700)]" style={{ borderColor: 'var(--line)' }}>
                비밀번호가 변경되었습니다. 새 비밀번호로 다시 로그인하세요.
              </div>
              <Link href="/login" className="flex items-center justify-center rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--indigo-600)' }}>
                로그인
              </Link>
            </div>
          ) : !validSession ? (
            <div className="space-y-5">
              <div className="flex items-start gap-2 rounded-lg bg-[#fee2e2] px-3 py-2 text-[12px] leading-relaxed text-[var(--danger)]">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                <span>재설정 링크가 만료되었거나 유효하지 않습니다. 다시 요청하세요.</span>
              </div>
              <Link href="/forgot-password" className="flex items-center justify-center rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90" style={{ background: 'var(--indigo-600)' }}>
                재설정 메일 다시 받기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">새 비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="8자 이상"
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">새 비밀번호 확인</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="다시 입력"
                  required
                  minLength={8}
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
                />
              </div>
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-[#fee2e2] px-3 py-2 text-[12px] leading-relaxed text-[var(--danger)]">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" /> {error}
                </div>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ background: 'var(--indigo-600)' }}
              >
                <KeyRound size={15} />
                {loading ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
