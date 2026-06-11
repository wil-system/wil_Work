'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
  FileText, Calendar, StickyNote, Settings, Shield, ChevronDown, LogOut, X,
  Users, Key, LayoutList, Dot,
} from 'lucide-react';
import { Avatar } from './ui/avatar';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Board } from '@/lib/types';
import { useSidebar } from './sidebar-context';

const ICON_MAP: Record<string, React.ElementType> = {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell, Dot,
};

const WORKSPACE_NAV = [
  { href: '/calendar',    label: '캘린더',   icon: Calendar },
  { href: '/memo',        label: '메모장',   icon: StickyNote },
];

const ADMIN_NAV = [
  { href: '/admin/approvals',   label: '가입 승인',  icon: Shield },
  { href: '/admin/members',     label: '회원 관리',  icon: Users },
  { href: '/admin/permissions', label: '권한 관리',  icon: Key },
  { href: '/admin/boards',      label: '게시판 관리', icon: LayoutList },
];

interface BoardSidebarProps {
  currentUser: Profile;
  boards?: Board[];
  canWriteWorkReport?: boolean;
  canReviewWorkReport?: boolean;
}

export default function BoardSidebar({
  currentUser,
  boards = [],
  canWriteWorkReport = true,
  canReviewWorkReport = false,
}: BoardSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [boardsOpen, setBoardsOpen] = useState(true);
  const [adminOpen, setAdminOpen] = useState(true);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { isOpen, close } = useSidebar();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  async function handleSignOut() {
    if (signingOut) return;
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(2px)' }}
          onClick={close}
        />
      )}
    <aside
      className={`flex flex-col h-screen w-[220px] flex-shrink-0 select-none fixed md:static inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
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
        <button
          onClick={close}
          className="absolute top-4 right-3 p-1.5 rounded-lg md:hidden"
          style={{ color: 'var(--stone-500)' }}
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        <NavItem href="/feed" icon={LayoutDashboard} label="전체 피드" active={isActive('/feed')} onSelect={close} />

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
            const Icon = board.id === 'notice' ? Bell : (ICON_MAP[board.icon] ?? Dot);
            return (
              <NavItem
                key={board.id}
                href={`/board/${board.id}`}
                icon={Icon}
                label={board.name}
                active={isActive(`/board/${board.id}`)}
                onSelect={close}
              />
            );
          })}
        </div>

        <div className="mt-3">
          <div className="px-3 py-1 text-[10px] font-semibold tracking-widest uppercase" style={{ color: 'var(--stone-400)' }}>
            워크스페이스
          </div>
          {(canWriteWorkReport || canReviewWorkReport) && (
            <div>
              <div className="mt-1 flex items-center gap-2.5 px-3 py-1 text-[11px] font-semibold" style={{ color: 'var(--stone-500)' }}>
                <FileText size={13} style={{ color: 'var(--stone-400)' }} />
                <span>업무게시판</span>
              </div>
              {canWriteWorkReport && (
                <NavItem
                  href="/work-report?mode=write"
                  icon={FileText}
                  label="업무보고 작성"
                  active={pathname === '/work-report'}
                  nested
                  onSelect={close}
                />
              )}
              {canReviewWorkReport && (
                <NavItem
                  href="/work-report/review"
                  icon={LayoutList}
                  label="업무보고 검토"
                  active={isActive('/work-report/review')}
                  nested
                  onSelect={close}
                />
              )}
            </div>
          )}
          {WORKSPACE_NAV.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} onSelect={close} />
          ))}
        </div>

        {currentUser.role === 'admin' && (
          <div className="mt-3">
            <button
              onClick={() => setAdminOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold tracking-widest uppercase"
              style={{ color: 'var(--stone-400)' }}
            >
              <span>관리자</span>
              <ChevronDown size={11} className={`transition-transform duration-200 ${adminOpen ? '' : '-rotate-90'}`} />
            </button>
            {adminOpen && ADMIN_NAV.map(item => (
              <NavItem
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={isActive(item.href)}
                nested
                onSelect={close}
              />
            ))}
          </div>
        )}
      </div>

      <div className="p-3 space-y-0.5" style={{ borderTop: '1px solid var(--line)' }}>
        <NavItem href="/notifications" icon={Bell} label="알림" active={isActive('/notifications')} onSelect={close} />
        <NavItem href="/settings" icon={Settings} label="설정" active={isActive('/settings')} onSelect={close} />

        <button
          onClick={() => setShowSignOutConfirm(true)}
          data-sidebar-signout-trigger
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
    {showSignOutConfirm && (
      <div
        className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
        role="presentation"
        onClick={() => setShowSignOutConfirm(false)}
      >
        <div
          data-sidebar-signout-dialog
          role="dialog"
          aria-modal="true"
          aria-labelledby="signout-confirm-title"
          className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl"
          onClick={event => event.stopPropagation()}
        >
          <div className="mb-4 flex items-start gap-3">
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
              style={{ background: 'var(--stone-100)', color: 'var(--stone-600)' }}
            >
              <LogOut size={17} />
            </div>
            <div className="min-w-0">
              <h2 id="signout-confirm-title" className="text-[15px] font-bold text-[var(--foreground)]">
                로그아웃하시겠습니까?
              </h2>
              <p className="mt-1 text-[12px] leading-relaxed text-[var(--muted)]">
                현재 계정에서 로그아웃하고 로그인 화면으로 이동합니다.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowSignOutConfirm(false)}
              className="flex-1 rounded-lg border py-2.5 text-[13px] font-semibold transition-colors hover:bg-[var(--stone-50)]"
              style={{ borderColor: 'var(--line)', color: 'var(--stone-700)' }}
              disabled={signingOut}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex-1 rounded-lg py-2.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--indigo-600)' }}
              disabled={signingOut}
            >
              {signingOut ? '로그아웃 중...' : '로그아웃'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

function NavItem({
  href, icon: Icon, label, active, nested = false, onSelect,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  nested?: boolean;
  onSelect?: () => void;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium ${nested ? 'ml-3' : ''}`}
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
      onClick={onSelect}
    >
      <Icon
        size={15}
        style={{ color: active ? 'var(--indigo-500)' : 'var(--stone-400)', flexShrink: 0 }}
      />
      <span>{label}</span>
    </Link>
  );
}
