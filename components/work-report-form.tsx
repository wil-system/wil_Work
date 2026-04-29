'use client';
import { useState, useRef } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { submitReport } from '@/app/(workspace)/work-report/actions';

export default function WorkReportForm() {
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    const formData = new FormData(e.currentTarget);
    const result = await submitReport(formData);
    setSubmitting(false);
    if (result.success) {
      setSubmitted(true);
      formRef.current?.reset();
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  }

  return (
    <div className="card p-5">
      <h2 className="text-[14px] font-bold text-[var(--foreground)] mb-4">오늘 업무보고 작성</h2>
      {submitted ? (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <CheckCircle2 size={32} className="text-[var(--success)]" />
          <div className="text-[14px] font-semibold text-[var(--foreground)]">제출 완료!</div>
          <div className="text-[12px] text-[var(--muted)]">업무보고가 제출되었습니다.</div>
          <button
            onClick={() => setSubmitted(false)}
            className="mt-2 px-4 py-2 rounded-lg text-[12px] font-medium border hover:bg-[var(--stone-50)] transition-colors"
            style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
          >
            다시 작성
          </button>
        </div>
      ) : (
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">오늘 완료한 업무</label>
            <textarea
              name="completed"
              rows={4}
              placeholder={"완료한 업무를 작성하세요\n(줄바꿈으로 구분)"}
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">내일 예정 업무</label>
            <textarea
              name="planned"
              rows={4}
              placeholder={"내일 예정 업무를 작성하세요\n(줄바꿈으로 구분)"}
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">이슈 / 특이사항</label>
            <textarea
              name="issues"
              rows={2}
              placeholder="이슈나 공유 사항이 있으면 작성하세요"
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
            style={{ background: 'var(--indigo-600)' }}
          >
            {submitting ? '제출 중...' : '업무보고 제출'}
          </button>
        </form>
      )}
    </div>
  );
}
