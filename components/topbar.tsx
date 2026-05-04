'use client';
import Link from 'next/link';
import { Bell, ChevronRight, Menu } from 'lucide-react';
import { Avatar } from './ui/avatar';
import type { Profile } from '@/lib/types';
import { useSidebar } from './sidebar-context';

interface TopbarProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  currentUser: Profile;
  unreadCount?: number;
}

export default function Topbar({ title, subtitle, breadcrumb, currentUser, unreadCount = 0 }: TopbarProps) {
  const { open } = useSidebar();
  return (
    <header
      className="h-14 flex items-center px-3 sm:px-6 gap-4 flex-shrink-0 sticky top-0 z-40 glass"
    >
      <button
        onClick={open}
        className="p-2 -ml-1 rounded-lg md:hidden flex-shrink-0"
        style={{ color: 'var(--stone-600)', transition: 'all 0.32s cubic-bezier(0.16,1,0.3,1)' }}
        onMouseEnter={e => (e.currentTarget.style.background = 'var(--stone-100)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <Menu size={18} />
      </button>
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-0.5">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={10} style={{ color: 'var(--stone-400)' }} />}
                {item.href
                  ? <Link href={item.href} className="text-[11px] hover:text-[var(--indigo-500)] transition-colors" style={{ color: 'var(--muted)' }}>{item.label}</Link>
                  : <span className="text-[11px]" style={{ color: 'var(--muted)' }}>{item.label}</span>
                }
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[15px] font-bold truncate" style={{ color: 'var(--foreground)', lineHeight: '1.3' }}>{title}</h1>
        {subtitle && <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{subtitle}</p>}
      </div>

      <Link
        href="/notifications"
        className="relative p-2 rounded-lg"
        style={{ transition: 'all 0.32s cubic-bezier(0.16,1,0.3,1)' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.background = 'var(--stone-100)')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.background = 'transparent')}
      >
        <Bell size={17} style={{ color: 'var(--stone-600)' }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 w-4 h-4 rounded-full text-white text-[9px] font-bold flex items-center justify-center"
            style={{ background: 'var(--indigo-500)' }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Link>

      <Link href="/profile" className="flex items-center gap-2" style={{ transition: 'opacity 0.2s' }}
        onMouseEnter={e => ((e.currentTarget as HTMLElement).style.opacity = '0.75')}
        onMouseLeave={e => ((e.currentTarget as HTMLElement).style.opacity = '1')}
      >
        <Avatar initial={currentUser.avatarInitial} color={currentUser.avatarColor} size="sm" />
        <span className="text-[12px] font-semibold hidden md:block" style={{ color: 'var(--stone-700)' }}>
          {currentUser.name}
        </span>
      </Link>
    </header>
  );
}
