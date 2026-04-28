import Topbar from '@/components/topbar';
import { Bell, Palette } from 'lucide-react';

const SECTIONS = [
  {
    title: '알림 설정',
    icon: Bell,
    items: [
      { label: '새 댓글 알림', desc: '내 게시글에 댓글이 달리면 알림을 받습니다', enabled: true },
      { label: '가입 승인 알림', desc: '새 가입 신청 시 알림을 받습니다 (관리자 전용)', enabled: true },
      { label: '이메일 알림', desc: '알림을 이메일로도 받습니다', enabled: false },
    ],
  },
  {
    title: '화면 설정',
    icon: Palette,
    items: [
      { label: '다크 모드', desc: '어두운 테마로 전환합니다', enabled: false },
      { label: '알림 배지 표시', desc: '사이드바에 읽지 않은 알림 수를 표시합니다', enabled: true },
    ],
  },
];

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="설정" />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-xl space-y-4">
        {SECTIONS.map(section => (
          <div key={section.title} className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <section.icon size={16} className="text-[var(--indigo-500)]" />
              <h2 className="text-[14px] font-bold text-[var(--foreground)]">{section.title}</h2>
            </div>
            <div className="space-y-4">
              {section.items.map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--foreground)]">{item.label}</div>
                    <div className="text-[11px] text-[var(--muted)]">{item.desc}</div>
                  </div>
                  <button
                    className="relative w-10 h-5 rounded-full transition-colors flex-shrink-0"
                    style={{ background: item.enabled ? 'var(--indigo-500)' : 'var(--stone-300)' }}
                  >
                    <span
                      className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{ transform: item.enabled ? 'translateX(22px)' : 'translateX(2px)' }}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
