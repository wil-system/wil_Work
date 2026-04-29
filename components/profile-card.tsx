'use client';
import { useState } from 'react';
import { Mail, Building, Briefcase, Calendar, AlertCircle, Check } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { updateProfile } from '@/app/(workspace)/profile/actions';
import type { Profile } from '@/lib/types';

interface ProfileCardProps {
  user: Profile;
}

export default function ProfileCard({ user }: ProfileCardProps) {
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess(false);
    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);
    setSubmitting(false);
    if (result.success) {
      setEditing(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } else {
      setError(result.error ?? '오류가 발생했습니다.');
    }
  }

  return (
    <div className="card p-6">
      {/* Avatar + name header */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
          style={{ background: user.avatarColor }}
        >
          {user.avatarInitial}
        </div>
        <div>
          <h2 className="text-[18px] font-bold text-[var(--foreground)]">{user.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={user.role === 'admin' ? 'indigo' : 'gray'}>
              {user.role === 'admin' ? '관리자' : '멤버'}
            </Badge>
            <Badge variant="green">승인됨</Badge>
          </div>
        </div>
      </div>

      {/* View mode */}
      {!editing && (
        <>
          <div className="space-y-3 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
            {[
              { icon: Mail,      label: '이메일', value: user.email },
              { icon: Building,  label: '부서',   value: user.department },
              { icon: Briefcase, label: '직책',   value: user.position },
              { icon: Calendar,  label: '입사일', value: user.joinedAt.replace(/-/g, '.') },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={15} className="text-[var(--muted)] flex-shrink-0" />
                <span className="text-[12px] text-[var(--muted)] w-16">{item.label}</span>
                <span className="text-[13px] text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 pt-5 border-t" style={{ borderColor: 'var(--line)' }}>
            {success && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--success)] mb-3">
                <Check size={13} /> 프로필이 업데이트되었습니다.
              </div>
            )}
            <button
              onClick={() => setEditing(true)}
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold border hover:bg-[var(--stone-50)] transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
            >
              프로필 수정
            </button>
          </div>
        </>
      )}

      {/* Edit mode */}
      {editing && (
        <form onSubmit={handleSave} className="border-t pt-5 space-y-4" style={{ borderColor: 'var(--line)' }}>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">이름 *</label>
            <input
              type="text"
              name="name"
              required
              defaultValue={user.name}
              className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">부서</label>
            <input
              type="text"
              name="department"
              defaultValue={user.department}
              placeholder="부서명"
              className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-[var(--stone-600)] mb-1.5 uppercase tracking-wide">직책</label>
            <input
              type="text"
              name="position"
              defaultValue={user.position}
              placeholder="직책명"
              className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
          </div>
          <div className="text-[11px] text-[var(--muted)]">
            이메일과 입사일은 수정할 수 없습니다.
          </div>
          {error && (
            <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
              <AlertCircle size={13} /> {error}
            </div>
          )}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setEditing(false); setError(''); }}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-medium border hover:bg-[var(--stone-50)] transition-colors"
              style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
              style={{ background: 'var(--indigo-600)' }}
            >
              {submitting ? '저장 중...' : '저장'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
