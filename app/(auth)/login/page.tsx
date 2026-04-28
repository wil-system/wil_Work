'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase
      .from('work_profiles')
      .select('status')
      .eq('id', user!.id)
      .single();

    if (profile?.status === 'pending') {
      await supabase.auth.signOut();
      router.push('/pending');
      return;
    }
    if (profile?.status === 'rejected') {
      await supabase.auth.signOut();
      setError('계정이 거절되었습니다. 관리자에게 문의하세요.');
      setLoading(false);
      return;
    }

    router.push('/feed');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-1">W · I · L</div>
          <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase">Workspace</div>
        </div>
        <div className="card p-7">
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">로그인</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6">WIL 협업 워크스페이스에 오신 것을 환영합니다</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">비밀번호</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--indigo-600)' }}
            >
              <LogIn size={15} />
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[12px] text-[var(--muted)]">계정이 없으신가요? </span>
            <Link href="/register" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">
              회원가입 신청
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
