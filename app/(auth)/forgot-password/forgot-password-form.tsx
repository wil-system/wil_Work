'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

function getRedirectOrigin() {
  const isLocalHost = ['localhost', '127.0.0.1', '::1', '[::1]'].includes(window.location.hostname);
  if (isLocalHost) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
}

export default function ForgotPasswordForm({ initialError }: { initialError: string }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState(initialError);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const redirectTo = `${getRedirectOrigin()}/auth/callback?next=/reset-password`;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);

    if (resetError) {
      setError('재설정 메일 발송 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.');
      return;
    }

    setSent(true);
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
            {sent ? <ShieldCheck size={21} /> : <Mail size={21} />}
          </div>
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">비밀번호 재설정</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6 leading-relaxed">
            가입한 이메일로 재설정 링크를 보내드립니다.
          </p>

          {sent ? (
            <div className="space-y-5">
              <div className="rounded-lg border bg-[var(--stone-50)] px-3 py-3 text-[12px] leading-relaxed text-[var(--stone-700)]" style={{ borderColor: 'var(--line)' }}>
                계정이 존재하면 재설정 메일이 발송됩니다. 메일의 링크를 열어 새 비밀번호를 설정하세요.
              </div>
              <Link href="/login" className="flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-[12px] font-semibold text-[var(--stone-700)] transition-colors hover:bg-[var(--stone-50)]" style={{ borderColor: 'var(--line)' }}>
                <ArrowLeft size={14} />
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
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
                <Mail size={15} />
                {loading ? '메일 발송 중...' : '재설정 메일 받기'}
              </button>
              <Link href="/login" className="flex items-center justify-center gap-2 text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">
                <ArrowLeft size={13} />
                로그인으로 돌아가기
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
