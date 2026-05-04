'use client';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import type { Board, BoardPermission, BoardRole, Profile } from '@/lib/types';
import { saveBoardPermissions } from '@/app/(workspace)/admin/permissions/actions';

interface PermissionsAdminPanelProps {
  members: Profile[];
  boards: Board[];
  permissions: BoardPermission[];
}

export default function PermissionsAdminPanel({ members, boards, permissions }: PermissionsAdminPanelProps) {
  const [saveState, formAction, isSaving] = useActionState(saveBoardPermissions, {
    success: false,
    message: '',
  });

  const initialCells = useMemo(() => {
    const map = new Map<string, { allowed: boolean; role: BoardRole }>();

    for (const member of members) {
      for (const board of boards) {
        const permission = permissions.find(item => item.profileId === member.id && item.boardId === board.id);
        map.set(`${member.id}:${board.id}`, {
          allowed: Boolean(permission),
          role: permission?.role ?? 'member',
        });
      }
    }

    return map;
  }, [boards, members, permissions]);

  const [cells, setCells] = useState(initialCells);

  useEffect(() => {
    setCells(initialCells);
  }, [initialCells]);

  function updateCell(key: string, patch: Partial<{ allowed: boolean; role: BoardRole }>) {
    setCells(current => {
      const next = new Map(current);
      const previous = next.get(key) ?? { allowed: false, role: 'member' as BoardRole };
      next.set(key, { ...previous, ...patch });
      return next;
    });
  }

  return (
    <form action={formAction}>
      <div className="mb-3 flex items-center justify-end gap-3">
        <div
          aria-live="polite"
          className={`text-[12px] font-medium ${saveState.success ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}
        >
          {isSaving ? '저장 중...' : saveState.message}
        </div>
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg px-4 py-2 text-[13px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: 'var(--indigo-600)', opacity: isSaving ? 0.7 : 1 }}
        >
          {isSaving ? '저장 중' : '저장'}
        </button>
      </div>
      <div className="card overflow-x-auto">
        <div className="min-w-max">
          <table className="w-full">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">회원</th>
                {boards.map(board => (
                  <th key={board.id} className="text-center px-3 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wide">
                    {board.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {members.map(member => (
                <tr key={member.id} className="border-b last:border-0 hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)' }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Avatar initial={member.avatarInitial} color={member.avatarColor} size="sm" />
                      <div>
                        <div className="text-[13px] font-semibold text-[var(--foreground)]">{member.name}</div>
                        <div className="text-[10px] text-[var(--muted)]">{member.department} · {member.position}</div>
                      </div>
                    </div>
                  </td>
                  {boards.map(board => {
                    const key = `${member.id}:${board.id}`;
                    const cell = cells.get(key) ?? { allowed: false, role: 'member' as BoardRole };

                    return (
                      <td key={board.id} className="px-3 py-3 text-center">
                        <input type="hidden" name="permissionPair" value={key} />
                        <input type="hidden" name={`allow:${key}`} value={cell.allowed ? 'true' : 'false'} />
                        <div className="flex items-center justify-center gap-2">
                          <label className="inline-flex items-center gap-1.5 text-[12px] text-[var(--stone-600)]">
                            <input
                              type="checkbox"
                              checked={cell.allowed}
                              onChange={event => updateCell(key, { allowed: event.target.checked })}
                              className="h-4 w-4 rounded accent-[var(--indigo-600)]"
                            />
                            허용
                          </label>
                          <select
                            name={`role:${key}`}
                            value={cell.role}
                            disabled={!cell.allowed}
                            onChange={event => updateCell(key, { role: event.target.value as BoardRole })}
                            className="rounded-lg border px-2 py-1.5 text-[12px] outline-none transition-opacity focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)] disabled:opacity-40"
                            style={{ borderColor: 'var(--line)', background: 'white', color: 'var(--foreground)' }}
                          >
                            <option value="member">팀원</option>
                            <option value="leader">팀장</option>
                          </select>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </form>
  );
}
