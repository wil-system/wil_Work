'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Send } from 'lucide-react';
import { submitReport } from '@/app/(workspace)/work-report/actions';
import { UNASSIGNED_WORK_REPORT_DEPARTMENT_LABEL } from '@/lib/work-report-departments';
import type { Profile, WorkReport } from '@/lib/types';

function formatLocalDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function textareaValue(items: string[]) {
  return items.join('\n');
}

export default function WorkReportForm({
  departmentOptions,
  recipients,
  report,
}: {
  departmentOptions: string[];
  recipients: Profile[];
  report?: WorkReport;
}) {
  const router = useRouter();
  const today = useMemo(() => formatLocalDate(new Date()), []);
  const isEditing = Boolean(report);
  const reportRecipientIsSelectable = Boolean(report?.recipientId && recipients.some(recipient => recipient.id === report.recipientId));
  const [department, setDepartment] = useState(report?.department ?? '');
  const [recipientId, setRecipientId] = useState(reportRecipientIsSelectable ? report!.recipientId! : recipients[0]?.id ?? '');
  const [periodStart, setPeriodStart] = useState(report?.periodStart ?? today);
  const [periodEnd, setPeriodEnd] = useState(report?.periodEnd ?? today);
  const recipientLocked = isEditing && reportRecipientIsSelectable;
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const result = await submitReport(formData);
    setSubmitting(false);

    if (result.success) {
      if (isEditing) {
        setSubmitted(true);
        setMessage({ type: 'success', text: '수정한 업무보고가 다시 제출되었습니다.' });
        router.replace(`/work-report?report=${result.reportId ?? report!.id}`);
        router.refresh();
        return;
      }
      setMessage({
        type: 'success',
        text: isEditing ? '수정한 업무보고가 다시 제출되었습니다.' : '업무보고가 제출되었습니다.',
      });
      if (!isEditing) {
        formRef.current?.reset();
        setDepartment('');
        setRecipientId(recipients[0]?.id ?? '');
        setPeriodStart(today);
        setPeriodEnd(today);
      }
    } else {
      setMessage({ type: 'error', text: result.error ?? '오류가 발생했습니다.' });
    }
  }

  if (recipients.length === 0) {
    return (
      <div className="card p-5">
        <h2 className="text-[14px] font-bold text-[var(--foreground)]">업무보고 작성</h2>
        <p className="mt-2 text-[12px] text-[var(--muted)]">
          선택할 수 있는 수신자가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="mb-4">
        <h2 className="text-[14px] font-bold text-[var(--foreground)]">{isEditing ? '업무보고 수정' : '업무보고 작성'}</h2>
        <p className="mt-1 text-[12px] text-[var(--muted)]">
          {isEditing ? '수정요청 받은 보고의 내용을 보완해 다시 제출합니다.' : '부서와 기간을 선택해 업무 히스토리를 남깁니다.'}
        </p>
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        {isEditing && (
          <>
            <input type="hidden" name="reportId" value={report!.id} />
            <input type="hidden" name="boardId" value={report?.boardId ?? ''} />
            <input type="hidden" name="department" value={department} />
            {recipientLocked && <input type="hidden" name="recipientId" value={recipientId} />}
            <input type="hidden" name="periodStart" value={periodStart} />
            <input type="hidden" name="periodEnd" value={periodEnd} />
          </>
        )}
        <label className="block">
          <span className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">부서</span>
          <select
            name="department"
            value={department}
            onChange={event => setDepartment(event.target.value)}
            disabled={isEditing}
            className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] disabled:cursor-not-allowed disabled:text-[var(--stone-500)]"
            style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
          >
            <option value="">{UNASSIGNED_WORK_REPORT_DEPARTMENT_LABEL}</option>
            {departmentOptions.map(departmentName => (
              <option key={departmentName} value={departmentName}>{departmentName}</option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">수신자</span>
          <select
            name="recipientId"
            value={recipientId}
            onChange={event => setRecipientId(event.target.value)}
            disabled={recipientLocked}
            required
            className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] disabled:cursor-not-allowed disabled:text-[var(--stone-500)]"
            style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
          >
            {recipients.map(recipient => (
              <option key={recipient.id} value={recipient.id}>
                {recipient.department || '부서 미지정'} · {recipient.name}{recipient.position ? ` (${recipient.position})` : ''}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">시작일</span>
            <input
              type="date"
              name="periodStart"
              value={periodStart}
              onChange={event => setPeriodStart(event.target.value)}
              disabled={isEditing}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] disabled:cursor-not-allowed disabled:text-[var(--stone-500)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </label>
          <label className="block">
            <span className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">종료일</span>
            <input
              type="date"
              name="periodEnd"
              value={periodEnd}
              onChange={event => setPeriodEnd(event.target.value)}
              disabled={isEditing}
              required
              className="w-full rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] disabled:cursor-not-allowed disabled:text-[var(--stone-500)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </label>
        </div>

        {[
          ['goals', '목표', '이번 기간의 목표를 줄바꿈으로 작성하세요'],
          ['progress', '진행업무', '진행했거나 완료한 업무를 줄바꿈으로 작성하세요'],
          ['issues', '이슈사항', '이슈나 공유 사항을 작성하세요'],
          ['nextPlan', '다음계획', '다음 기간에 이어갈 계획을 줄바꿈으로 작성하세요'],
        ].map(([name, label, placeholder]) => (
          <label key={name} className="block">
            <span className="block text-[11px] font-semibold text-[var(--stone-600)] mb-2 uppercase tracking-wide">{label}</span>
            <textarea
              name={name}
              rows={name === 'issues' ? 2 : 3}
              placeholder={placeholder}
              defaultValue={
                name === 'goals' ? textareaValue(report?.goals ?? []) :
                name === 'progress' ? textareaValue(report?.progress ?? []) :
                name === 'issues' ? report?.issues ?? '' :
                textareaValue(report?.nextPlan ?? [])
              }
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </label>
        ))}

        {message && (
          <div
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] ${
              message.type === 'success' ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#fee2e2] text-[var(--danger)]'
            }`}
          >
            {message.type === 'success' ? <CheckCircle2 size={13} /> : <AlertCircle size={13} />}
            {message.text}
          </div>
        )}

        <div className="pt-1">
          <button
            type="submit"
            disabled={submitting || submitted}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
            style={{ background: 'var(--indigo-600)' }}
          >
            <Send size={14} />
            {submitted ? '제출 완료' : submitting ? '제출 중...' : isEditing ? '수정 후 다시 제출' : '업무보고 제출'}
          </button>
        </div>
      </form>
    </div>
  );
}
