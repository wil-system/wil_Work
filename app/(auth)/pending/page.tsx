import Link from 'next/link';
import { Clock, Mail } from 'lucide-react';

export default function PendingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm text-center">
        <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-8">W · I · L</div>
        <div className="card p-8">
          <div className="w-14 h-14 rounded-2xl bg-[var(--indigo-50)] flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-[var(--indigo-500)]" />
          </div>
          <h1 className="text-[18px] font-bold text-[var(--foreground)] mb-2">승인 대기 중</h1>
          <p className="text-[12px] text-[var(--muted)] leading-relaxed mb-6">
            회원가입 신청이 완료되었습니다.<br />
            관리자 승인 후 로그인이 가능합니다.<br />
            승인 완료 시 이메일로 안내드립니다.
          </p>
          <div className="flex items-center gap-2 justify-center text-[11px] text-[var(--muted)] bg-[var(--stone-100)] rounded-lg px-4 py-3 mb-6">
            <Mail size={13} />
            <span>your@email.com</span>
          </div>
          <Link href="/login" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}
