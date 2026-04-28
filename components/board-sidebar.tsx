'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
  FileText, Calendar, StickyNote, Settings, Shield,
  ChevronDown, LogOut,
} from 'lucide-react';
import { Avatar } from './ui/avatar';
import { getProfile, getAccessibleBoards, CURRENT_USER_ID } from '@/lib/mock-data';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
};

const WORKSPACE_NAV = [
  { href: '/work-report', label: '업무보고', icon: FileText },
  { href: '/calendar',    label: '캘린더',   icon: Calendar },
  { href: '/memo',        label: '메모장',   icon: StickyNote },
];

export default function BoardSidebar() {
  const pathname = usePathname();
  const [boardsOpen, setBoardsOpen] = useState(true);
  const currentUser = getProfile(CURRENT_USER_ID)!;
  const boards = getAccessibleBoards(CURRENT_USER_ID);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className="flex flex-col h-screen w-[220px] flex-shrink-0 select-none"
      style={{ background: 'var(--bg-sidebar)', boxShadow: 'var(--shadow-sidebar)' }}
    >
      {/* Logo */}
      <div className="px-5 pt-5 pb-4">
        <div className="text-[11px] font-black tracking-[3px] text-white/90">W · I · L</div>
        <div className="text-[10px] text-white/40 mt-0.5 tracking-wide">WORKSPACE</div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        {/* Feed */}
        <NavItem href="/feed" icon={LayoutDashboard} label="전체 피드" active={isActive('/feed')} />

        {/* Boards */}
        <div className="mt-3">
          <button
            onClick={() => setBoardsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 hover:text-white/50 transition-colors uppercase"
          >
            <span>게시판</span>
            <ChevronDown
              size={12}
              className={`transition-transform ${boardsOpen ? '' : '-rotate-90'}`}
            />
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

        {/* Workspace tools */}
        <div className="mt-3">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
            워크스페이스
          </div>
          {WORKSPACE_NAV.map(item => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isActive(item.href)}
            />
          ))}
        </div>

        {/* Admin */}
        {currentUser.role === 'admin' && (
          <div className="mt-3">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">
              관리자
            </div>
            <NavItem
              href="/admin/approvals"
              icon={Shield}
              label="가입 승인"
              active={isActive('/admin')}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-white/10 p-3 space-y-1">
        <NavItem href="/notifications" icon={Bell} label="알림" active={isActive('/notifications')} />
        <NavItem href="/settings" icon={Settings} label="설정" active={isActive('/settings')} />
        <div className="mt-2 flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors">
          <Avatar initial={currentUser.avatarInitial} color={currentUser.avatarColor} size="sm" />
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold text-white/90 truncate">{currentUser.name}</div>
            <div className="text-[10px] text-white/40 truncate">{currentUser.position}</div>
          </div>
          <LogOut size={13} className="text-white/30 flex-shrink-0" />
        </div>
      </div>
    </aside>
  );
}

function NavItem({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
        active
          ? 'bg-[#2d2a45] text-white'
          : 'text-white/60 hover:text-white/90 hover:bg-white/5'
      }`}
    >
      <Icon size={15} className={active ? 'text-[#818cf8]' : ''} />
      <span>{label}</span>
    </Link>
  );
}
