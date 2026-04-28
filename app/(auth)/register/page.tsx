'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', department: '', position: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();

    const avatarInitial = form.name.charAt(0).toUpperCase();
    const colors = ['#1e1b4b','#0f766e','#b45309','#7c3aed','#be185d','#0369a1'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          department: form.department,
          position: form.position,
          avatar_initial: avatarInitial,
          avatar_color: avatarColor,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? '이미 등록된 이메일입니다.'
        : '가입 신청 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    router.push('/pending');
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-1">W · I · L</div>
          <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase">Workspace</div>
        </div>
        <div className="card p-7">
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">회원가입 신청</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6">관리자 승인 후 로그인이 가능합니다</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이름</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="홍길동" required
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">부서</label>
                <input type="text" value={form.department} onChange={set('department')} placeholder="영업팀" required
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">직책</label>
              <input type="text" value={form.position} onChange={set('position')} placeholder="팀원" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">비밀번호</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="8자 이상" required minLength={8}
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--indigo-600)' }}>
              <UserPlus size={15} />
              {loading ? '처리 중...' : '가입 신청하기'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[12px] text-[var(--muted)]">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
