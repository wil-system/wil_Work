import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import { getPendingProfiles, getCurrentProfile, updateProfileStatus } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

type ApprovalStatus = 'approved' | 'rejected';
type ApprovalErrorCode = 'not-admin' | 'missing-id' | 'missing-admin-credentials' | 'approve-failed' | 'reject-failed';

const approvalErrorMessages: Record<ApprovalErrorCode, string> = {
  'not-admin': '관리자 권한을 확인할 수 없습니다. 다시 로그인한 뒤 시도해 주세요.',
  'missing-id': '승인할 사용자를 찾을 수 없습니다. 새로고침 후 다시 시도해 주세요.',
  'missing-admin-credentials': '가입 승인을 처리할 서버 관리자 키가 설정되지 않았습니다. 배포 환경의 SUPABASE_SERVICE_ROLE_KEY를 확인해 주세요.',
  'approve-failed': '승인 처리 중 서버 오류가 발생했습니다. 서버 로그와 Supabase Auth 상태를 확인해 주세요.',
  'reject-failed': '거절 처리 중 서버 오류가 발생했습니다. 서버 로그를 확인해 주세요.',
};

function getApprovalErrorMessage(code: string | undefined) {
  if (!code || !(code in approvalErrorMessages)) return null;
  return approvalErrorMessages[code as ApprovalErrorCode];
}

function isMissingAdminCredentialsError(error: unknown) {
  return error instanceof Error && error.message === 'Supabase admin credentials are not configured.';
}

async function updateUserStatusFromForm(formData: FormData, status: ApprovalStatus): Promise<ApprovalErrorCode | null> {
  const admin = await getCurrentProfile();
  if (!admin || admin.role !== 'admin') return 'not-admin';

  const id = formData.get('id');
  if (typeof id !== 'string' || id.length === 0) return 'missing-id';

  try {
    await updateProfileStatus(id, status);
    return null;
  } catch (error) {
    console.error(`Failed to ${status} profile`, error);
    if (isMissingAdminCredentialsError(error)) return 'missing-admin-credentials';
    return status === 'approved' ? 'approve-failed' : 'reject-failed';
  }
}

function redirectToApprovals(error?: ApprovalErrorCode) {
  if (!error) redirect('/admin/approvals');
  redirect(`/admin/approvals?approvalError=${encodeURIComponent(error)}`);
}

async function approveUser(formData: FormData) {
  'use server';
  const error = await updateUserStatusFromForm(formData, 'approved');
  if (error) redirectToApprovals(error);
  revalidatePath('/admin/approvals');
  redirectToApprovals();
}

async function rejectUser(formData: FormData) {
  'use server';
  const error = await updateUserStatusFromForm(formData, 'rejected');
  if (error) redirectToApprovals(error);
  revalidatePath('/admin/approvals');
  redirectToApprovals();
}

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams?: Promise<{ approvalError?: string | string[] }>;
}) {
  const params = searchParams ? await searchParams : {};
  const approvalError = Array.isArray(params.approvalError) ? params.approvalError[0] : params.approvalError;
  const approvalErrorMessage = getApprovalErrorMessage(approvalError);

  const [pending, user, unreadCount] = await Promise.all([
    getPendingProfiles(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar
        title="가입 승인"
        breadcrumb={[{ label: '관리자' }, { label: '가입 승인' }]}
        currentUser={user!}
        unreadCount={unreadCount}
      />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl space-y-4">
        {approvalErrorMessage ? (
          <div
            role="alert"
            className="rounded-lg border px-4 py-3 text-[12px] font-medium"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'rgba(220, 38, 38, 0.06)' }}
          >
            {approvalErrorMessage}
          </div>
        ) : null}
        {pending.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">대기 중인 가입 신청이 없습니다.</div>
        ) : (
          pending.map(u => (
            <div key={u.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar initial={u.avatarInitial} color={u.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--foreground)]">{u.name}</span>
                    <Badge variant="yellow">승인 대기</Badge>
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">{u.department} · {u.position}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail size={11} className="text-[var(--muted)]" />
                    <span className="text-[11px] text-[var(--muted)]">{u.email}</span>
                  </div>
                  <div className="text-[10px] text-[var(--stone-400)] mt-1">신청일: {u.joinedAt.replace(/-/g, '.')}</div>
                </div>
                <div className="flex gap-2">
                  <form action={approveUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--indigo-600)' }}>
                      <CheckCircle2 size={13} /> 승인
                    </button>
                  </form>
                  <form action={rejectUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)', color: 'var(--danger)' }}>
                      <XCircle size={13} /> 거절
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
