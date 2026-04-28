import Link from 'next/link';
import { Bell, Search, ChevronRight } from 'lucide-react';
import { Avatar } from './ui/avatar';
import type { Profile } from '@/lib/types';

interface TopbarProps {
  title: string;
  subtitle?: string;
  breadcrumb?: { label: string; href?: string }[];
  currentUser: Profile;
  unreadCount?: number;
}

export default function Topbar({ title, subtitle, breadcrumb, currentUser, unreadCount = 0 }: TopbarProps) {
  return (
    <header className="h-14 border-b flex items-center px-6 gap-4 flex-shrink-0" style={{ background: 'white', borderColor: 'var(--line)' }}>
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-0.5">
            {breadcrumb.map((item, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <ChevronRight size={11} className="text-[var(--stone-400)]" />}
                {item.href
                  ? <Link href={item.href} className="text-[11px] text-[var(--muted)] hover:text-[var(--indigo-500)]">{item.label}</Link>
                  : <span className="text-[11px] text-[var(--muted)]">{item.label}</span>
                }
              </span>
            ))}
          </div>
        )}
        <h1 className="text-[15px] font-bold text-[var(--foreground)] truncate">{title}</h1>
        {subtitle && <p className="text-[11px] text-[var(--muted)]">{subtitle}</p>}
      </div>
      <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--stone-100)] text-[var(--muted)] text-[12px] hover:bg-[var(--stone-200)] transition-colors">
        <Search size={13} /><span>검색</span><kbd className="ml-1 text-[10px] opacity-60">⌘K</kbd>
      </button>
      <Link href="/notifications" className="relative p-2 rounded-lg hover:bg-[var(--stone-100)] transition-colors">
        <Bell size={17} className="text-[var(--stone-600)]" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-[var(--indigo-500)] rounded-full text-white text-[9px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </Link>
      <Link href="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <Avatar initial={currentUser.avatarInitial} color={currentUser.avatarColor} size="sm" />
        <span className="text-[12px] font-semibold text-[var(--stone-700)] hidden md:block">{currentUser.name}</span>
      </Link>
    </header>
  );
}
