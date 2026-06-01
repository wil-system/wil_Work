'use client';
import { useState, useTransition } from 'react';
import {
  type NotificationSettingKey,
  type NotificationSettings,
} from '@/lib/notification-settings';
import { useSidebar } from './sidebar-context';

const SETTINGS_ITEMS = [
  { key: '새 댓글 알림' as NotificationSettingKey, desc: '내 게시글에 댓글이 달리면 알림을 받습니다' },
  { key: '가입 승인 알림' as NotificationSettingKey, desc: '새 가입 신청 시 알림을 받습니다 (관리자 전용)' },
  { key: '알림 배지 표시' as NotificationSettingKey, desc: '상단에 읽지 않은 알림 수를 표시합니다' },
];

interface SettingsPanelProps {
  initialSettings: NotificationSettings;
  updateSetting: (key: NotificationSettingKey, enabled: boolean) => Promise<NotificationSettings>;
}

export default function SettingsPanel({ initialSettings, updateSetting }: SettingsPanelProps) {
  const [settings, setSettings] = useState(initialSettings);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();
  const { setNotificationSettings } = useSidebar();

  function toggle(key: NotificationSettingKey) {
    if (isPending) return;

    const next = { ...settings, [key]: !settings[key] };
    const previous = settings;
    setSettings(next);
    setNotificationSettings(next);
    setError('');

    startTransition(async () => {
      try {
        const saved = await updateSetting(key, next[key]);
        setSettings(saved);
        setNotificationSettings(saved);
      } catch {
        setSettings(previous);
        setNotificationSettings(previous);
        setError('설정 저장 중 오류가 발생했습니다.');
      }
    });
  }

  return (
    <div className="card p-5">
      <div className="space-y-4">
        {SETTINGS_ITEMS.map(item => {
          const enabled = settings[item.key];
          const disabled = isPending;
          return (
            <div key={item.key} className="flex items-center justify-between">
              <div>
                <div className="text-[13px] font-medium text-[var(--foreground)]">{item.key}</div>
                <div className="text-[11px] text-[var(--muted)]">{item.desc}</div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={enabled}
                disabled={disabled}
                onClick={() => toggle(item.key)}
                className="relative h-6 w-11 flex-shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--indigo-200)]"
                style={{ background: enabled ? 'var(--indigo-500)' : 'var(--stone-300)' }}
                aria-label={`${item.key} ${enabled ? '끄기' : '켜기'}`}
              >
                <span
                  className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: enabled ? 'translateX(20px)' : 'translateX(0)' }}
                />
              </button>
            </div>
          );
        })}
      </div>
      {error && <p className="mt-4 text-[12px] text-[var(--danger)]">{error}</p>}
    </div>
  );
}
