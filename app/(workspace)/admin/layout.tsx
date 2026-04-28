import Link from 'next/link';
import { Shield, Users, Key, LayoutList } from 'lucide-react';

const ADMIN_NAV = [
  { href: '/admin/approvals',   label: '가입 승인',  icon: Shield },
  { href: '/admin/members',     label: '회원 관리',  icon: Users },
  { href: '/admin/permissions', label: '권한 관리',  icon: Key },
  { href: '/admin/boards',      label: '게시판 관리', icon: LayoutList },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full overflow-hidden">
      <nav className="w-48 flex-shrink-0 border-r p-3 space-y-0.5" style={{ borderColor: 'var(--line)', background: 'white' }}>
        <div className="px-3 py-2 text-[10px] font-semibold tracking-widest text-[var(--muted)] uppercase">관리자 메뉴</div>
        {ADMIN_NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium text-[var(--stone-600)] hover:text-[var(--foreground)] hover:bg-[var(--stone-100)] transition-colors"
          >
            <item.icon size={14} />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="flex-1 overflow-hidden flex flex-col">{children}</div>
    </div>
  );
}
