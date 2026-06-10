'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RotateCcw, Save } from 'lucide-react';
import { saveMemberUpdates } from '@/app/(workspace)/admin/members/actions';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  getChangedMemberUpdates,
  normalizeMemberUpdate,
  type MemberUpdateInput,
} from '@/lib/member-updates';
import type { Profile } from '@/lib/types';

interface MembersAdminPanelProps {
  members: Profile[];
  currentUserId: string;
}

function toEditableMember(member: Profile): MemberUpdateInput {
  return normalizeMemberUpdate({
    id: member.id,
    department: member.department,
    position: member.position,
    role: member.role,
  });
}

export default function MembersAdminPanel({ members, currentUserId }: MembersAdminPanelProps) {
  const router = useRouter();
  const incomingItems = useMemo(() => members.map(toEditableMember), [members]);
  const profileById = useMemo(
    () => new Map(members.map(member => [member.id, member])),
    [members]
  );
  const [baseline, setBaseline] = useState(incomingItems);
  const [items, setItems] = useState(incomingItems);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const changedUpdates = useMemo(
    () => getChangedMemberUpdates(baseline, items),
    [baseline, items]
  );
  const hasChanges = changedUpdates.length > 0;

  function updateMember(id: string, patch: Partial<MemberUpdateInput>) {
    setItems(current => current.map(member => (
      member.id === id ? normalizeMemberUpdate({ ...member, ...patch }) : member
    )));
    setSaved(false);
    setError('');
  }

  function toggleRole(member: MemberUpdateInput) {
    if (member.id === currentUserId) return;
    updateMember(member.id, {
      role: member.role === 'admin' ? 'member' : 'admin',
    });
  }

  function resetChanges() {
    setItems(baseline);
    setSaved(false);
    setError('');
  }

  async function handleSave() {
    if (!hasChanges) return;

    setSaving(true);
    setError('');
    setSaved(false);
    const result = await saveMemberUpdates(changedUpdates);
    setSaving(false);

    if (result.success) {
      const nextBaseline = items.map(normalizeMemberUpdate);
      setBaseline(nextBaseline);
      setItems(nextBaseline);
      setSaved(true);
      router.refresh();
    } else {
      setError(result.error ?? '회원 정보를 저장하지 못했습니다.');
    }
  }

  return (
    <>
      <div className="md:hidden space-y-3">
        {items.map(item => {
          const member = profileById.get(item.id);
          if (!member) return null;

          return (
            <div key={item.id} className="card p-4">
              <div className="flex items-center gap-3">
                <Avatar initial={member.avatarInitial} color={member.avatarColor} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[var(--foreground)]">{member.name}</div>
                  <div className="text-[11px] text-[var(--muted)]">{member.email}</div>
                </div>
                <Badge variant={item.role === 'admin' ? 'indigo' : 'gray'}>
                  {item.role === 'admin' ? '관리자' : '회원'}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <input
                  value={item.department}
                  onChange={event => updateMember(item.id, { department: event.target.value })}
                  placeholder="부서"
                  className="rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)' }}
                />
                <input
                  value={item.position}
                  onChange={event => updateMember(item.id, { position: event.target.value })}
                  placeholder="직책"
                  className="rounded-lg border px-3 py-2 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)' }}
                />
              </div>
              {item.id !== currentUserId && (
                <button
                  type="button"
                  onClick={() => toggleRole(item)}
                  className="mt-2 w-full rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[var(--stone-50)]"
                  style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
                >
                  {item.role === 'admin' ? '회원으로 변경' : '관리자로 변경'}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden md:block card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
              {['이름', '부서', '직책', '이메일', '권한', '가입일', '관리'].map(header => (
                <th key={header} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map(item => {
              const member = profileById.get(item.id);
              if (!member) return null;

              return (
                <tr key={item.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar initial={member.avatarInitial} color={member.avatarColor} size="sm" />
                      <span className="text-[13px] font-semibold text-[var(--foreground)]">{member.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={item.department}
                      onChange={event => updateMember(item.id, { department: event.target.value })}
                      className="w-32 rounded-lg border px-2 py-1.5 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      value={item.position}
                      onChange={event => updateMember(item.id, { position: event.target.value })}
                      className="w-32 rounded-lg border px-2 py-1.5 text-[12px] outline-none focus:border-[var(--indigo-500)]"
                      style={{ borderColor: 'var(--line)' }}
                    />
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--stone-500)]">{member.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={item.role === 'admin' ? 'indigo' : 'gray'}>
                      {item.role === 'admin' ? '관리자' : '회원'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--muted)]">{member.joinedAt.replace(/-/g, '.')}</td>
                  <td className="px-4 py-3">
                    {item.id === currentUserId ? (
                      <span className="text-[11px] text-[var(--muted)]">본인</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleRole(item)}
                        className="rounded border px-2 py-1 text-[11px] transition-colors hover:bg-[var(--stone-50)]"
                        style={{ borderColor: 'var(--line)', color: 'var(--muted)' }}
                      >
                        {item.role === 'admin' ? '회원 전환' : '관리자 전환'}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {(hasChanges || saved || error) && (
        <div className="sticky bottom-0 z-10 -mx-4 mt-4 border-t bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6" style={{ borderColor: 'var(--line)' }}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className={`text-[12px] ${error ? 'text-[var(--danger)]' : 'text-[var(--muted)]'}`}>
              {error || (hasChanges ? `${changedUpdates.length}명 변경 내용이 있습니다.` : '회원 정보를 저장했습니다.')}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetChanges}
                disabled={!hasChanges || saving}
                className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold transition-colors hover:bg-[var(--stone-50)] disabled:opacity-50"
                style={{ borderColor: 'var(--line)', color: 'var(--foreground)' }}
              >
                <RotateCcw size={13} /> 되돌리기
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--indigo-600)' }}
              >
                <Save size={13} /> {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
