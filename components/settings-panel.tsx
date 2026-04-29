'use client';
import { useState, useEffect } from 'react';
import { Bell, Palette } from 'lucide-react';

const SETTING_KEYS = [
  '새 댓글 알림', '가입 승인 알림', '이메일 알림', '다크 모드', '알림 배지 표시',
] as const;
type SettingKey = typeof SETTING_KEYS[number];

const DEFAULT_SETTINGS: Record<SettingKey, boolean> = {
  '새 댓글 알림': true,
  '가입 승인 알림': true,
  '이메일 알림': false,
  '다크 모드': false,
  '알림 배지 표시': true,
};

const SECTIONS = [
  {
    title: '알림 설정',
    icon: Bell,
    items: [
      { key: '새 댓글 알림' as SettingKey, desc: '내 게시글에 댓글이 달리면 알림을 받습니다' },
      { key: '가입 승인 알림' as SettingKey, desc: '새 가입 신청 시 알림을 받습니다 (관리자 전용)' },
      { key: '이메일 알림' as SettingKey, desc: '알림을 이메일로도 받습니다' },
    ],
  },
  {
    title: '화면 설정',
    icon: Palette,
    items: [
      { key: '다크 모드' as SettingKey, desc: '어두운 테마로 전환합니다' },
      { key: '알림 배지 표시' as SettingKey, desc: '사이드바에 읽지 않은 알림 수를 표시합니다' },
    ],
  },
];

const STORAGE_KEY = 'wil_settings';

export default function SettingsPanel() {
  const [settings, setSettings] = useState<Record<SettingKey, boolean>>(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<Record<SettingKey, boolean>>;
        setSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch {}
    setMounted(true);
  }, []);

  function toggle(key: SettingKey) {
    setSettings(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }

  if (!mounted) return null;

  return (
    <div className="space-y-4">
      {SECTIONS.map(section => (
        <div key={section.title} className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <section.icon size={16} className="text-[var(--indigo-500)]" />
            <h2 className="text-[14px] font-bold text-[var(--foreground)]">{section.title}</h2>
          </div>
          <div className="space-y-4">
            {section.items.map(item => {
              const enabled = settings[item.key];
              return (
                <div key={item.key} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--foreground)]">{item.key}</div>
                    <div className="text-[11px] text-[var(--muted)]">{item.desc}</div>
                  </div>
                  <button
                    onClick={() => toggle(item.key)}
                    className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                    style={{ background: enabled ? 'var(--indigo-500)' : 'var(--stone-300)' }}
                    aria-label={`${item.key} ${enabled ? '끄기' : '켜기'}`}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: enabled ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
