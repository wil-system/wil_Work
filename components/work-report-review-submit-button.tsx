'use client';

import { useFormStatus } from 'react-dom';

export default function WorkReportReviewSubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg px-3 py-2 text-[12px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      style={{ background: 'var(--stone-800)' }}
    >
      {pending ? '저장 중...' : '저장'}
    </button>
  );
}
