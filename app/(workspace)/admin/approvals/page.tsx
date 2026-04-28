import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import { getPendingUsers } from '@/lib/mock-data';

export default function ApprovalsPage() {
  const pending = getPendingUsers();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="가입 승인"
        subtitle={`승인 대기 중인 신청 ${pending.length}건`}
        breadcrumb={[{ label: '관리자' }, { label: '가입 승인' }]}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl space-y-4">
        {pending.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">
            대기 중인 가입 신청이 없습니다.
          </div>
        ) : (
          pending.map(user => (
            <div key={user.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar initial={user.avatarInitial} color={user.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--foreground)]">{user.name}</span>
                    <Badge variant="yellow">승인 대기</Badge>
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">{user.department} · {user.position}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail size={11} className="text-[var(--muted)]" />
                    <span className="text-[11px] text-[var(--muted)]">{user.email}</span>
                  </div>
                  <div className="text-[10px] text-[var(--stone-400)] mt-1">신청일: {user.joinedAt.replace(/-/g, '.')}</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-all"
                    style={{ background: 'var(--indigo-600)' }}
                  >
                    <CheckCircle2 size={13} /> 승인
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border hover:bg-[var(--stone-50)] transition-colors"
                    style={{ borderColor: 'var(--line)', color: 'var(--danger)' }}
                  >
                    <XCircle size={13} /> 거절
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
