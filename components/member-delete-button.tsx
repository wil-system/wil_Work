'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { deleteMember } from '@/app/(workspace)/admin/members/actions';
import { getMemberDeleteConfirmationMessage } from '@/lib/member-management';

interface MemberDeleteButtonProps {
  memberId: string;
  memberName: string;
  variant?: 'compact' | 'full';
}

export default function MemberDeleteButton({
  memberId,
  memberName,
  variant = 'compact',
}: MemberDeleteButtonProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(getMemberDeleteConfirmationMessage(memberName))) return;

    startTransition(async () => {
      const result = await deleteMember(memberId);
      if (!result.success) {
        window.alert(result.error ?? '회원을 삭제하지 못했습니다.');
        return;
      }

      router.refresh();
    });
  }

  const isFull = variant === 'full';

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className={
        isFull
          ? 'flex w-full items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[#fee2e2] disabled:opacity-60'
          : 'flex items-center gap-1 rounded border px-2 py-1 text-[11px] transition-colors hover:bg-[#fee2e2] disabled:opacity-60'
      }
      style={{ borderColor: 'var(--line)', color: 'var(--danger)' }}
      aria-label={`${memberName} 회원 삭제`}
      title="회원 삭제"
    >
      <Trash2 size={isFull ? 13 : 12} />
      {isPending ? '삭제 중...' : '삭제'}
    </button>
  );
}
