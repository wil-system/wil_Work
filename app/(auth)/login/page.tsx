import Link from 'next/link';
import { LogIn } from 'lucide-react';

export default function LoginPage() {
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
          <div className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
              <input
                type="email"
                placeholder="your@email.com"
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">비밀번호</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            <Link
              href="/feed"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: 'var(--indigo-600)' }}
            >
              <LogIn size={15} />
              로그인
            </Link>
          </div>
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
