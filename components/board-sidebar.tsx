'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
  FileText, Calendar, StickyNote, Settings, Shield, ChevronDown, LogOut,
} from 'lucide-react';
import { Avatar } from './ui/avatar';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Board } from '@/lib/types';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
};

const WORKSPACE_NAV = [
  { href: '/work-report', label: '업무보고', icon: FileText },
  { href: '/calendar',    label: '캘린더',   icon: Calendar },
  { href: '/memo',        label: '메모장',   icon: StickyNote },
];

interface BoardSidebarProps {
  currentUser: Profile;
  boards?: Board[];
}

export default function BoardSidebar({ currentUser, boards = [] }: BoardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [boardsOpen, setBoardsOpen] = useState(true);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <aside
      className="flex flex-col h-screen w-[220px] flex-shrink-0 select-none"
      style={{ background: 'var(--bg-sidebar)', boxShadow: 'var(--shadow-sidebar)' }}
    >
      {/* Logo area with ambient gradient */}
      <div className="relative px-5 pt-5 pb-4 overflow-hidden">
        <div
          className="absolute -top-6 -left-6 w-28 h-28 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)' }}
        />
        <div className="relative">
          <div className="text-[14px] font-black tracking-[2px] gradient-text">W·I·L</div>
          <div className="text-[10px] mt-0.5 tracking-widest font-semibold" style={{ color: 'var(--stone-400)' }}>WORKSPACE</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        <NavItem href="/feed" icon={LayoutDashboard} label="전체 피드" active={isActive('/feed')} />

        <div className="mt-3">
          <button
            onClick={() => setBoardsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold tracking-widest uppercase"
            style={{ color: 'var(--stone-400)' }}
          >
            <span>게시판</span>
            <ChevronDown size={11} className={`transition-transform duration-200 ${boardsOpen ? '' : '-rotate-90'}`} />
          </button>
          {boardsOpen && boards.filter(b => b.id !== 'feed').map(board => {
            const Icon = ICON_MAP[board.icon] ?? Bell;
            return (
              <NavItem
                key={board.id}
                href={`/board/${board.id}`}
                icon={Icon}
                label={board.name}
                active={isActive(`/board/${board.id}`)}
              />
            );
          })}
        </div>

        <div className="mt-3">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--stone-400)' }}>
            워크스페이스
          </div>
          {WORKSPACE_NAV.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} />
          ))}
        </div>

        {currentUser.role === 'admin' && (
          <div className="mt-3">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--stone-400)' }}>
              관리자
            </div>
            <NavItem href="/admin/approvals" icon={Shield} label="가입 승인" active={isActive('/admin')} />
          </div>
        )}
      </div>

      <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid var(--line)' }}>
        <NavItem href="/notifications" icon={Bell} label="알림" active={isActive('/notifications')} />
        <NavItem href="/settings" icon={Settings} label="설정" active={isActive('/settings')} />

        <button
          onClick={handleSignOut}
          className="mt-1 flex items-center gap-2.5 w-full px-2.5 py-2 rounded-lg text-left"
          style={{ color: 'var(--stone-600)', transition: 'all 0.32s cubic-bezier(0.16,1,0.3,1)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--stone-100)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <Avatar initial={currentUser.avatarInitial} color={currentUser.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate" style={{ color: 'var(--foreground)' }}>{currentUser.name}</div>
            <div className="text-[10px] truncate" style={{ color: 'var(--muted)' }}>{currentUser.position}</div>
          </div>
          <LogOut size={13} style={{ color: 'var(--stone-400)' }} className="flex-shrink-0" />
        </button>
      </div>
    </aside>
  );
}

function NavItem({
  href, icon: Icon, label, active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium"
      style={{
        background: active ? 'var(--bg-sidebar-active)' : 'transparent',
        color: active ? 'var(--indigo-700)' : 'var(--stone-600)',
        transition: 'all 0.32s cubic-bezier(0.16,1,0.3,1)',
      }}
      onMouseEnter={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-sidebar-hover)';
      }}
      onMouseLeave={e => {
        if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <Icon
        size={15}
        style={{ color: active ? 'var(--indigo-500)' : 'var(--stone-400)', flexShrink: 0 }}
      />
      <span>{label}</span>
    </Link>
  );
}
