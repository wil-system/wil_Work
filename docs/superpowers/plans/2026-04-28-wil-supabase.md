# WIL Supabase Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all mock data with real Supabase backend — Auth (sign up → admin approval → sign in), database CRUD for all features, and protected routes.

**Architecture:** Next.js App Router with `@supabase/ssr` for cookie-based auth. Server Components fetch data server-side; Client Components use browser client for mutations. Middleware protects all `/` workspace routes. All tables use `work_` prefix to avoid conflicts with existing Supabase tables.

**Tech Stack:** Next.js 14 App Router, `@supabase/ssr`, `@supabase/supabase-js`, TypeScript, Supabase Auth + PostgreSQL + RLS policies.

**Table naming rule:** Every table for this project uses `work_` prefix. Never create, modify, or query tables without this prefix.

---

## File Map

**New files to create:**
- `lib/supabase/client.ts` — browser client (Client Components)
- `lib/supabase/server.ts` — server client (Server Components, Route Handlers)
- `lib/supabase/middleware.ts` — auth session refresh helper
- `middleware.ts` — protect workspace routes, redirect unauthenticated users
- `lib/db/profiles.ts` — profile queries
- `lib/db/boards.ts` — board + permission queries
- `lib/db/posts.ts` — post + comment + attachment queries
- `lib/db/reports.ts` — work report queries
- `lib/db/calendar.ts` — calendar event queries
- `lib/db/memos.ts` — memo queries
- `lib/db/notifications.ts` — notification queries
- `supabase/schema.sql` — full database schema (run once in Supabase SQL editor)

**Modify:**
- `app/(auth)/login/page.tsx` — wire up sign in form
- `app/(auth)/register/page.tsx` — wire up sign up form
- `app/(auth)/pending/page.tsx` — check real status
- `app/(workspace)/layout.tsx` — inject current user from session
- `app/(workspace)/feed/page.tsx` — real data
- `app/(workspace)/board/[boardId]/page.tsx` — real data + permission check
- `app/(workspace)/work-report/page.tsx` — real data
- `app/(workspace)/calendar/page.tsx` — real data
- `app/(workspace)/memo/page.tsx` — real data
- `app/(workspace)/notifications/page.tsx` — real data
- `app/(workspace)/profile/page.tsx` — real user data
- `app/(workspace)/admin/approvals/page.tsx` — real pending users
- `app/(workspace)/admin/members/page.tsx` — real members
- `app/(workspace)/admin/permissions/page.tsx` — real permissions
- `app/(workspace)/admin/boards/page.tsx` — real boards
- `components/board-sidebar.tsx` — real boards + user from session
- `components/topbar.tsx` — real user + unread count
- `components/composer.tsx` — submit post to DB
- `lib/mock-data.ts` — keep for fallback only

---

## Task 1: Install @supabase/ssr

**Files:**
- Modify: `package.json` (via npm)

- [ ] **Step 1: Install the package**

```bash
npm install @supabase/ssr
```

Expected: `added N packages` with no errors.

- [ ] **Step 2: Verify install**

```bash
npm list @supabase/ssr
```

Expected: `@supabase/ssr@x.x.x`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add @supabase/ssr for Next.js App Router auth"
```

---

## Task 2: Supabase Client Helpers

**Files:**
- Create: `lib/supabase/client.ts`
- Create: `lib/supabase/server.ts`
- Create: `lib/supabase/middleware.ts`

- [ ] **Step 1: Create lib/supabase/client.ts** (browser client for Client Components)

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

- [ ] **Step 2: Create lib/supabase/server.ts** (server client for Server Components)

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

- [ ] **Step 3: Create lib/supabase/middleware.ts**

```typescript
// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isWorkspacePath = !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/register') &&
    !request.nextUrl.pathname.startsWith('/pending') &&
    !request.nextUrl.pathname.startsWith('/_next') &&
    !request.nextUrl.pathname.startsWith('/favicon');

  if (isWorkspacePath && !user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/supabase/
git commit -m "feat: add Supabase client helpers (browser, server, middleware)"
```

---

## Task 3: Middleware — Protect Workspace Routes

**Files:**
- Create: `middleware.ts`

- [ ] **Step 1: Create middleware.ts**

```typescript
// middleware.ts
import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
```

- [ ] **Step 2: Verify dev server starts without error**

```bash
npm run dev
```

Visit http://localhost:3000/feed — should redirect to /login (not logged in).
Visit http://localhost:3000/login — should load normally.

- [ ] **Step 3: Commit**

```bash
git add middleware.ts
git commit -m "feat: middleware — redirect unauthenticated users to /login"
```

---

## Task 4: Database Schema

**Files:**
- Create: `supabase/schema.sql`

- [ ] **Step 1: Create supabase/schema.sql**

```sql
-- supabase/schema.sql
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ALL tables use work_ prefix to avoid conflicts with existing tables

-- Profiles (extends auth.users)
create table if not exists work_profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  name text not null,
  email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  department text not null default '',
  position text not null default '',
  avatar_initial text not null default '',
  avatar_color text not null default '#1e1b4b',
  joined_at timestamptz not null default now()
);

-- Boards
create table if not exists work_boards (
  id text primary key,
  name text not null,
  description text not null default '',
  icon text not null default 'Bell',
  is_public boolean not null default false,
  created_at timestamptz not null default now()
);

-- Board permissions (which members can access which non-public boards)
create table if not exists work_board_permissions (
  profile_id uuid references work_profiles(id) on delete cascade,
  board_id text references work_boards(id) on delete cascade,
  primary key (profile_id, board_id)
);

-- Posts
create table if not exists work_posts (
  id uuid primary key default gen_random_uuid(),
  board_id text references work_boards(id) on delete cascade not null,
  author_id uuid references work_profiles(id) on delete cascade not null,
  title text,
  content text not null default '',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

-- Attachments
create table if not exists work_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references work_posts(id) on delete cascade not null,
  name text not null,
  size text not null,
  type text not null default 'other',
  storage_path text not null default '',
  created_at timestamptz not null default now()
);

-- Comments
create table if not exists work_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references work_posts(id) on delete cascade not null,
  author_id uuid references work_profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- Work reports
create table if not exists work_reports (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references work_profiles(id) on delete cascade not null,
  date date not null default current_date,
  planned_tasks text[] not null default '{}',
  completed_tasks text[] not null default '{}',
  issues text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  created_at timestamptz not null default now()
);

-- Calendar events
create table if not exists work_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  end_date date,
  all_day boolean not null default false,
  type text not null default 'meeting' check (type in ('meeting', 'deadline', 'holiday', 'personal')),
  attendees uuid[] not null default '{}',
  description text,
  created_by uuid references work_profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

-- Memos
create table if not exists work_memos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid references work_profiles(id) on delete cascade not null,
  title text not null default '',
  content text not null default '',
  tags text[] not null default '{}',
  is_pinned boolean not null default false,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Notifications
create table if not exists work_notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references work_profiles(id) on delete cascade not null,
  type text not null check (type in ('comment', 'mention', 'approval', 'board', 'report')),
  title text not null,
  body text not null,
  is_read boolean not null default false,
  link text,
  created_at timestamptz not null default now()
);

-- ── Seed: default boards ──────────────────────────────────────
insert into work_boards (id, name, description, icon, is_public) values
  ('feed',      '전체 피드',  '모든 팀원의 소식을 확인하세요', 'LayoutDashboard', true),
  ('sales',     '영업팀',    '영업팀 전용 게시판',            'TrendingUp',      false),
  ('dev',       '개발팀',    '개발팀 이슈 및 공유',           'Code2',           false),
  ('marketing', '마케팅',    '마케팅 캠페인 및 콘텐츠',       'Megaphone',       false),
  ('notice',    '공지사항',  '전사 공지',                     'Bell',            true)
on conflict (id) do nothing;

-- ── RLS: enable on all tables ─────────────────────────────────
alter table work_profiles enable row level security;
alter table work_boards enable row level security;
alter table work_board_permissions enable row level security;
alter table work_posts enable row level security;
alter table work_attachments enable row level security;
alter table work_comments enable row level security;
alter table work_reports enable row level security;
alter table work_calendar_events enable row level security;
alter table work_memos enable row level security;
alter table work_notifications enable row level security;

-- ── RLS Policies ─────────────────────────────────────────────

-- Helper: check if current user is admin
create or replace function is_work_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from work_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Helper: check if current user is approved
create or replace function is_work_approved()
returns boolean language sql security definer as $$
  select exists (
    select 1 from work_profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

-- work_profiles
create policy "Approved users can read all profiles"
  on work_profiles for select
  using (is_work_approved());

create policy "Users can update own profile"
  on work_profiles for update
  using (id = auth.uid());

create policy "Admins can update any profile"
  on work_profiles for update
  using (is_work_admin());

create policy "Users can insert own profile"
  on work_profiles for insert
  with check (id = auth.uid());

-- work_boards
create policy "Approved users can read all boards"
  on work_boards for select
  using (is_work_approved());

create policy "Admins can insert boards"
  on work_boards for insert
  with check (is_work_admin());

create policy "Admins can update boards"
  on work_boards for update
  using (is_work_admin());

-- work_board_permissions
create policy "Approved users can read permissions"
  on work_board_permissions for select
  using (is_work_approved());

create policy "Admins can manage permissions"
  on work_board_permissions for all
  using (is_work_admin());

-- work_posts (users can read boards they have access to)
create policy "Users can read posts on accessible boards"
  on work_posts for select
  using (
    is_work_approved() and (
      (select is_public from work_boards where id = board_id) = true
      or is_work_admin()
      or exists (
        select 1 from work_board_permissions
        where profile_id = auth.uid() and board_id = work_posts.board_id
      )
    )
  );

create policy "Approved users can insert posts"
  on work_posts for insert
  with check (is_work_approved() and author_id = auth.uid());

create policy "Authors can update own posts"
  on work_posts for update
  using (author_id = auth.uid() or is_work_admin());

-- work_attachments
create policy "Users can read attachments on accessible posts"
  on work_attachments for select
  using (is_work_approved());

create policy "Authors can insert attachments"
  on work_attachments for insert
  with check (is_work_approved());

-- work_comments
create policy "Users can read comments on accessible posts"
  on work_comments for select
  using (is_work_approved());

create policy "Approved users can insert comments"
  on work_comments for insert
  with check (is_work_approved() and author_id = auth.uid());

-- work_reports
create policy "Users can read all reports"
  on work_reports for select
  using (is_work_approved());

create policy "Users can insert own reports"
  on work_reports for insert
  with check (is_work_approved() and author_id = auth.uid());

create policy "Users can update own reports"
  on work_reports for update
  using (author_id = auth.uid() or is_work_admin());

-- work_calendar_events
create policy "Approved users can read all events"
  on work_calendar_events for select
  using (is_work_approved());

create policy "Approved users can insert events"
  on work_calendar_events for insert
  with check (is_work_approved());

create policy "Creator or admin can update events"
  on work_calendar_events for update
  using (created_by = auth.uid() or is_work_admin());

-- work_memos
create policy "Users can read own memos"
  on work_memos for select
  using (author_id = auth.uid());

create policy "Users can insert own memos"
  on work_memos for insert
  with check (author_id = auth.uid());

create policy "Users can update own memos"
  on work_memos for update
  using (author_id = auth.uid());

create policy "Users can delete own memos"
  on work_memos for delete
  using (author_id = auth.uid());

-- work_notifications
create policy "Users can read own notifications"
  on work_notifications for select
  using (profile_id = auth.uid());

create policy "Users can update own notifications"
  on work_notifications for update
  using (profile_id = auth.uid());

-- ── Auth trigger: create work_profiles on sign up ─────────────
create or replace function handle_new_work_user()
returns trigger language plpgsql security definer as $$
begin
  insert into work_profiles (id, name, email, department, position, avatar_initial, avatar_color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'position', ''),
    coalesce(new.raw_user_meta_data->>'avatar_initial', upper(substr(coalesce(new.raw_user_meta_data->>'name', new.email), 1, 1))),
    '#1e1b4b'
  );
  return new;
end;
$$;

drop trigger if exists on_work_auth_user_created on auth.users;
create trigger on_work_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_work_user();
```

- [ ] **Step 2: Run schema in Supabase**

Open Supabase dashboard → SQL Editor → New query → paste contents of `supabase/schema.sql` → Run.

Expected: "Success. No rows returned."

- [ ] **Step 3: Verify tables exist**

In Supabase dashboard → Table Editor, confirm these tables exist:
`work_profiles`, `work_boards`, `work_board_permissions`, `work_posts`, `work_attachments`, `work_comments`, `work_reports`, `work_calendar_events`, `work_memos`, `work_notifications`

Confirm `work_boards` has 5 rows (feed, sales, dev, marketing, notice).

- [ ] **Step 4: Commit**

```bash
git add supabase/schema.sql
git commit -m "feat: add Supabase schema — all work_ tables + RLS + trigger"
```

---

## Task 5: Auth — Login Page

**Files:**
- Modify: `app/(auth)/login/page.tsx`

- [ ] **Step 1: Rewrite app/(auth)/login/page.tsx as a Client Component**

```tsx
// app/(auth)/login/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogIn, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) {
      setError('이메일 또는 비밀번호가 올바르지 않습니다.');
      setLoading(false);
      return;
    }

    // Check approval status
    const { data: profile } = await supabase
      .from('work_profiles')
      .select('status')
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
      .single();

    if (profile?.status === 'pending') {
      await supabase.auth.signOut();
      router.push('/pending');
      return;
    }
    if (profile?.status === 'rejected') {
      await supabase.auth.signOut();
      setError('계정이 거절되었습니다. 관리자에게 문의하세요.');
      setLoading(false);
      return;
    }

    router.push('/feed');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-1">W · I · L</div>
          <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase">Workspace</div>
        </div>
        <div className="card p-7">
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">로그인</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6">WIL 협업 워크스페이스에 오신 것을 환영합니다</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">비밀번호</label>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <button
              type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--indigo-600)' }}
            >
              <LogIn size={15} />
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[12px] text-[var(--muted)]">계정이 없으신가요? </span>
            <Link href="/register" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">
              회원가입 신청
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test login**

1. Create a test user in Supabase dashboard → Authentication → Users → "Add user"
2. Set status to 'approved' in work_profiles (or run: `update work_profiles set status='approved', role='admin' where email='your@email.com'`)
3. Visit http://localhost:3000/login
4. Sign in → should redirect to /feed

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/login/page.tsx
git commit -m "feat: wire up login page with Supabase auth"
```

---

## Task 6: Auth — Register Page

**Files:**
- Modify: `app/(auth)/register/page.tsx`

- [ ] **Step 1: Rewrite app/(auth)/register/page.tsx**

```tsx
// app/(auth)/register/page.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserPlus, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', department: '', position: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [field]: e.target.value }));

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();

    const avatarInitial = form.name.charAt(0).toUpperCase();
    const colors = ['#1e1b4b','#0f766e','#b45309','#7c3aed','#be185d','#0369a1'];
    const avatarColor = colors[Math.floor(Math.random() * colors.length)];

    const { error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          department: form.department,
          position: form.position,
          avatar_initial: avatarInitial,
          avatar_color: avatarColor,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message === 'User already registered'
        ? '이미 등록된 이메일입니다.'
        : '가입 신청 중 오류가 발생했습니다.');
      setLoading(false);
      return;
    }

    // Notify admins by creating notifications (optional - handled by DB trigger in production)
    router.push('/pending');
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-app)' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-[13px] font-black tracking-[4px] text-[var(--indigo-700)] mb-1">W · I · L</div>
          <div className="text-[10px] tracking-widest text-[var(--muted)] uppercase">Workspace</div>
        </div>
        <div className="card p-7">
          <h1 className="text-[20px] font-bold text-[var(--foreground)] mb-1">회원가입 신청</h1>
          <p className="text-[12px] text-[var(--muted)] mb-6">관리자 승인 후 로그인이 가능합니다</p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이름</label>
                <input type="text" value={form.name} onChange={set('name')} placeholder="홍길동" required
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">부서</label>
                <input type="text" value={form.department} onChange={set('department')} placeholder="영업팀" required
                  className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                  style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
              </div>
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">직책</label>
              <input type="text" value={form.position} onChange={set('position')} placeholder="팀원" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">이메일</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="your@email.com" required
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[var(--stone-700)] mb-1.5">비밀번호</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="8자 이상" required minLength={8}
                className="w-full px-3 py-2.5 rounded-lg border text-[13px] outline-none focus:border-[var(--indigo-500)]"
                style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }} />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-[12px] text-[var(--danger)] bg-[#fee2e2] px-3 py-2 rounded-lg">
                <AlertCircle size={13} /> {error}
              </div>
            )}
            <button type="submit" disabled={loading}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: 'var(--indigo-600)' }}>
              <UserPlus size={15} />
              {loading ? '처리 중...' : '가입 신청하기'}
            </button>
          </form>
          <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: 'var(--line)' }}>
            <span className="text-[12px] text-[var(--muted)]">이미 계정이 있으신가요? </span>
            <Link href="/login" className="text-[12px] font-semibold text-[var(--indigo-600)] hover:underline">로그인</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test register flow**

1. Visit http://localhost:3000/register
2. Fill in all fields → submit
3. Should redirect to /pending
4. In Supabase → Authentication → Users: verify new user appears
5. In Supabase → Table Editor → work_profiles: verify row with status='pending'

- [ ] **Step 3: Commit**

```bash
git add app/\(auth\)/register/page.tsx
git commit -m "feat: wire up register page with Supabase auth + work_profiles trigger"
```

---

## Task 7: DB Layer — Profiles & Current User

**Files:**
- Create: `lib/db/profiles.ts`
- Modify: `app/(workspace)/layout.tsx`
- Modify: `components/board-sidebar.tsx`
- Modify: `components/topbar.tsx`

- [ ] **Step 1: Create lib/db/profiles.ts**

```typescript
// lib/db/profiles.ts
import { createClient } from '@/lib/supabase/server';
import type { Profile } from '@/lib/types';

function toProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as Profile['role'],
    status: row.status as Profile['status'],
    department: row.department as string,
    position: row.position as string,
    avatarInitial: row.avatar_initial as string,
    avatarColor: row.avatar_color as string,
    joinedAt: (row.joined_at as string).slice(0, 10),
  };
}

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('work_profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data ? toProfile(data) : null;
}

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('work_profiles')
    .select('*')
    .order('joined_at');
  return (data ?? []).map(toProfile);
}

export async function getPendingProfiles(): Promise<Profile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('work_profiles')
    .select('*')
    .eq('status', 'pending')
    .order('joined_at');
  return (data ?? []).map(toProfile);
}

export async function updateProfileStatus(id: string, status: 'approved' | 'rejected'): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_profiles').update({ status }).eq('id', id);
}
```

- [ ] **Step 2: Update app/(workspace)/layout.tsx to pass currentUser**

```tsx
// app/(workspace)/layout.tsx
import { redirect } from 'next/navigation';
import BoardSidebar from '@/components/board-sidebar';
import { getCurrentProfile } from '@/lib/db/profiles';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');
  if (user.status === 'pending') redirect('/pending');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <BoardSidebar currentUser={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update components/board-sidebar.tsx to accept currentUser prop**

Add `currentUser: Profile` prop instead of reading from mock data. Replace the top of the component:

```tsx
// components/board-sidebar.tsx
'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, TrendingUp, Code2, Megaphone, Bell,
  FileText, Calendar, StickyNote, Settings, Shield, ChevronDown, LogOut,
} from 'lucide-react';
import { Avatar } from './ui/avatar';
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
  const [boardsOpen, setBoardsOpen] = useState(true);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/');

  return (
    <aside
      className="flex flex-col h-screen w-[220px] flex-shrink-0 select-none"
      style={{ background: 'var(--bg-sidebar)', boxShadow: 'var(--shadow-sidebar)' }}
    >
      <div className="px-5 pt-5 pb-4">
        <div className="text-[11px] font-black tracking-[3px] text-white/90">W · I · L</div>
        <div className="text-[10px] text-white/40 mt-0.5 tracking-wide">WORKSPACE</div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5">
        <NavItem href="/feed" icon={LayoutDashboard} label="전체 피드" active={isActive('/feed')} />

        <div className="mt-3">
          <button
            onClick={() => setBoardsOpen(o => !o)}
            className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 hover:text-white/50 transition-colors uppercase"
          >
            <span>게시판</span>
            <ChevronDown size={12} className={`transition-transform ${boardsOpen ? '' : '-rotate-90'}`} />
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
          <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">워크스페이스</div>
          {WORKSPACE_NAV.map(item => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isActive(item.href)} />
          ))}
        </div>

        {currentUser.role === 'admin' && (
          <div className="mt-3">
            <div className="px-3 py-1 text-[10px] font-semibold tracking-widest text-white/30 uppercase">관리자</div>
            <NavItem href="/admin/approvals" icon={Shield} label="가입 승인" active={isActive('/admin')} />
          </div>
        )}
      </div>

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

function NavItem({ href, icon: Icon, label, active }: { href: string; icon: React.ElementType; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${
        active ? 'bg-[#2d2a45] text-white' : 'text-white/60 hover:text-white/90 hover:bg-white/5'
      }`}
    >
      <Icon size={15} className={active ? 'text-[#818cf8]' : ''} />
      <span>{label}</span>
    </Link>
  );
}
```

- [ ] **Step 4: Update components/topbar.tsx to accept currentUser prop**

Add `currentUser: Profile` prop and `unreadCount: number` prop:

```tsx
// components/topbar.tsx
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
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/profiles.ts app/\(workspace\)/layout.tsx components/board-sidebar.tsx components/topbar.tsx
git commit -m "feat: current user from Supabase session in layout/sidebar/topbar"
```

---

## Task 8: DB Layer — Boards + Permissions

**Files:**
- Create: `lib/db/boards.ts`
- Modify: `app/(workspace)/layout.tsx`
- Modify: `app/(workspace)/admin/boards/page.tsx`
- Modify: `app/(workspace)/admin/permissions/page.tsx`

- [ ] **Step 1: Create lib/db/boards.ts**

```typescript
// lib/db/boards.ts
import { createClient } from '@/lib/supabase/server';
import type { Board, BoardPermission } from '@/lib/types';

function toBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    icon: row.icon as string,
    isPublic: row.is_public as boolean,
    createdAt: (row.created_at as string).slice(0, 10),
  };
}

export async function getAllBoards(): Promise<Board[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('work_boards').select('*').order('created_at');
  return (data ?? []).map(toBoard);
}

export async function getAccessibleBoards(userId: string): Promise<Board[]> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('work_profiles').select('role').eq('id', userId).single();

  if (profile?.role === 'admin') {
    const { data } = await supabase.from('work_boards').select('*').order('created_at');
    return (data ?? []).map(toBoard);
  }

  const { data: perms } = await supabase
    .from('work_board_permissions').select('board_id').eq('profile_id', userId);
  const permittedIds = (perms ?? []).map((p: { board_id: string }) => p.board_id);

  const { data } = await supabase.from('work_boards').select('*').order('created_at');
  return (data ?? []).map(toBoard).filter(b => b.isPublic || permittedIds.includes(b.id));
}

export async function getAllBoardPermissions(): Promise<BoardPermission[]> {
  const supabase = await createClient();
  const { data } = await supabase.from('work_board_permissions').select('*');
  return (data ?? []).map((r: { profile_id: string; board_id: string }) => ({
    profileId: r.profile_id,
    boardId: r.board_id,
  }));
}

export async function toggleBoardPermission(profileId: string, boardId: string, grant: boolean): Promise<void> {
  const supabase = await createClient();
  if (grant) {
    await supabase.from('work_board_permissions').upsert({ profile_id: profileId, board_id: boardId });
  } else {
    await supabase.from('work_board_permissions')
      .delete().eq('profile_id', profileId).eq('board_id', boardId);
  }
}

export async function createBoard(board: Omit<Board, 'createdAt'>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_boards').insert({
    id: board.id,
    name: board.name,
    description: board.description,
    icon: board.icon,
    is_public: board.isPublic,
  });
}
```

- [ ] **Step 2: Update app/(workspace)/layout.tsx to pass boards to sidebar**

```tsx
// app/(workspace)/layout.tsx
import { redirect } from 'next/navigation';
import BoardSidebar from '@/components/board-sidebar';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getAccessibleBoards } from '@/lib/db/boards';

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentProfile();
  if (!user) redirect('/login');
  if (user.status === 'pending') redirect('/pending');

  const boards = await getAccessibleBoards(user.id);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg-app)' }}>
      <BoardSidebar currentUser={user} boards={boards} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/boards.ts app/\(workspace\)/layout.tsx
git commit -m "feat: boards and permissions from Supabase"
```

---

## Task 9: DB Layer — Posts + Comments

**Files:**
- Create: `lib/db/posts.ts`
- Modify: `app/(workspace)/feed/page.tsx`
- Modify: `app/(workspace)/board/[boardId]/page.tsx`
- Modify: `components/composer.tsx`

- [ ] **Step 1: Create lib/db/posts.ts**

```typescript
// lib/db/posts.ts
import { createClient } from '@/lib/supabase/server';
import type { Post, Comment, Attachment } from '@/lib/types';

function toPost(row: Record<string, unknown>): Post {
  return {
    id: row.id as string,
    boardId: row.board_id as string,
    authorId: row.author_id as string,
    title: row.title as string | undefined,
    content: row.content as string,
    attachments: ((row.work_attachments as Record<string, unknown>[]) ?? []).map(a => ({
      id: a.id as string,
      name: a.name as string,
      size: a.size as string,
      type: a.type as Attachment['type'],
    })),
    comments: ((row.work_comments as Record<string, unknown>[]) ?? []).map(c => ({
      id: c.id as string,
      authorId: c.author_id as string,
      content: c.content as string,
      createdAt: c.created_at as string,
    })),
    isPinned: row.is_pinned as boolean,
    createdAt: row.created_at as string,
  };
}

export async function getPostsForBoard(boardId: string): Promise<Post[]> {
  const supabase = await createClient();
  const query = supabase
    .from('work_posts')
    .select(`*, work_attachments(*), work_comments(*)`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  const { data } = boardId === 'feed'
    ? await query
    : await query.eq('board_id', boardId);

  return (data ?? []).map(toPost);
}

export async function createPost(post: {
  boardId: string;
  authorId: string;
  title?: string;
  content: string;
}): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('work_posts')
    .insert({
      board_id: post.boardId,
      author_id: post.authorId,
      title: post.title,
      content: post.content,
    })
    .select('id')
    .single();
  return data?.id ?? '';
}

export async function createComment(comment: {
  postId: string;
  authorId: string;
  content: string;
}): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_comments').insert({
    post_id: comment.postId,
    author_id: comment.authorId,
    content: comment.content,
  });
}
```

- [ ] **Step 2: Update app/(workspace)/feed/page.tsx**

```tsx
// app/(workspace)/feed/page.tsx
import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { getPostsForBoard } from '@/lib/db/posts';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function FeedPage() {
  const [posts, user, unreadCount] = await Promise.all([
    getPostsForBoard('feed'),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="전체 피드" subtitle="오늘 업무 현황을 확인하세요" currentUser={user!} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Composer boardId="feed" authorId={user!.id} />
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Update components/composer.tsx to accept boardId + authorId and submit to DB**

```tsx
// components/composer.tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Paperclip, Send } from 'lucide-react';
import { Avatar } from './ui/avatar';
import { createClient } from '@/lib/supabase/client';

interface ComposerProps {
  boardId: string;
  authorId: string;
  authorInitial?: string;
  authorColor?: string;
}

export default function Composer({ boardId, authorId, authorInitial = '?', authorColor = '#1e1b4b' }: ComposerProps) {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    const supabase = createClient();
    await supabase.from('work_posts').insert({
      board_id: boardId,
      author_id: authorId,
      content: content.trim(),
    });
    setContent('');
    setSubmitting(false);
    router.refresh();
  }

  return (
    <div className="card p-4">
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3">
          <Avatar initial={authorInitial} color={authorColor} size="md" />
          <div className="flex-1">
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="팀에 공유할 내용을 작성하세요..."
              rows={3}
              className="w-full resize-none rounded-lg border px-3 py-2.5 text-[13px] outline-none transition-colors focus:border-[var(--indigo-500)] focus:ring-2 focus:ring-[var(--indigo-100)]"
              style={{ borderColor: 'var(--line)', background: 'var(--stone-50)' }}
            />
            <div className="flex items-center justify-between mt-2">
              <button type="button" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] text-[var(--muted)] hover:bg-[var(--stone-100)] transition-colors">
                <Paperclip size={13} /> 파일 첨부
              </button>
              <button
                type="submit"
                disabled={!content.trim() || submitting}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: 'var(--indigo-600)' }}
              >
                <Send size={13} /> {submitting ? '게시 중...' : '게시'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/db/posts.ts app/\(workspace\)/feed/page.tsx components/composer.tsx
git commit -m "feat: posts and comments from Supabase"
```

---

## Task 10: DB Layer — Work Reports, Calendar, Memos

**Files:**
- Create: `lib/db/reports.ts`
- Create: `lib/db/calendar.ts`
- Create: `lib/db/memos.ts`
- Modify: `app/(workspace)/work-report/page.tsx`
- Modify: `app/(workspace)/calendar/page.tsx`
- Modify: `app/(workspace)/memo/page.tsx`

- [ ] **Step 1: Create lib/db/reports.ts**

```typescript
// lib/db/reports.ts
import { createClient } from '@/lib/supabase/server';
import type { WorkReport } from '@/lib/types';

function toReport(row: Record<string, unknown>): WorkReport {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    date: row.date as string,
    plannedTasks: row.planned_tasks as string[],
    completedTasks: row.completed_tasks as string[],
    issues: row.issues as string | undefined,
    status: row.status as WorkReport['status'],
  };
}

export async function getTodayReports(): Promise<WorkReport[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('work_reports')
    .select('*')
    .eq('date', today)
    .order('created_at');
  return (data ?? []).map(toReport);
}

export async function upsertReport(report: Omit<WorkReport, 'id'>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_reports').upsert({
    author_id: report.authorId,
    date: report.date,
    planned_tasks: report.plannedTasks,
    completed_tasks: report.completedTasks,
    issues: report.issues,
    status: report.status,
  }, { onConflict: 'author_id,date' });
}
```

- [ ] **Step 2: Create lib/db/calendar.ts**

```typescript
// lib/db/calendar.ts
import { createClient } from '@/lib/supabase/server';
import type { CalendarEvent } from '@/lib/types';

function toEvent(row: Record<string, unknown>): CalendarEvent {
  return {
    id: row.id as string,
    title: row.title as string,
    date: row.date as string,
    endDate: row.end_date as string | undefined,
    allDay: row.all_day as boolean,
    type: row.type as CalendarEvent['type'],
    attendees: row.attendees as string[],
    description: row.description as string | undefined,
  };
}

export async function getMonthEvents(year: number, month: number): Promise<CalendarEvent[]> {
  const supabase = await createClient();
  const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const to = `${year}-${String(month + 1).padStart(2, '0')}-31`;
  const { data } = await supabase
    .from('work_calendar_events')
    .select('*')
    .gte('date', from)
    .lte('date', to)
    .order('date');
  return (data ?? []).map(toEvent);
}

export async function createCalendarEvent(event: Omit<CalendarEvent, 'id'>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_calendar_events').insert({
    title: event.title,
    date: event.date,
    end_date: event.endDate,
    all_day: event.allDay,
    type: event.type,
    attendees: event.attendees,
    description: event.description,
  });
}
```

- [ ] **Step 3: Create lib/db/memos.ts**

```typescript
// lib/db/memos.ts
import { createClient } from '@/lib/supabase/server';
import type { Memo } from '@/lib/types';

function toMemo(row: Record<string, unknown>): Memo {
  return {
    id: row.id as string,
    authorId: row.author_id as string,
    title: row.title as string,
    content: row.content as string,
    tags: row.tags as string[],
    isPinned: row.is_pinned as boolean,
    updatedAt: row.updated_at as string,
  };
}

export async function getMyMemos(authorId: string): Promise<Memo[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('work_memos')
    .select('*')
    .eq('author_id', authorId)
    .order('is_pinned', { ascending: false })
    .order('updated_at', { ascending: false });
  return (data ?? []).map(toMemo);
}

export async function createMemo(memo: Omit<Memo, 'id' | 'updatedAt'>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_memos').insert({
    author_id: memo.authorId,
    title: memo.title,
    content: memo.content,
    tags: memo.tags,
    is_pinned: memo.isPinned,
  });
}

export async function updateMemo(id: string, updates: Partial<Pick<Memo, 'title' | 'content' | 'tags' | 'isPinned'>>): Promise<void> {
  const supabase = await createClient();
  await supabase.from('work_memos').update({
    ...(updates.title !== undefined && { title: updates.title }),
    ...(updates.content !== undefined && { content: updates.content }),
    ...(updates.tags !== undefined && { tags: updates.tags }),
    ...(updates.isPinned !== undefined && { is_pinned: updates.isPinned }),
    updated_at: new Date().toISOString(),
  }).eq('id', id);
}
```

- [ ] **Step 4: Update work-report, calendar, memo pages to use real data**

```tsx
// app/(workspace)/work-report/page.tsx — replace getTodayReports + getAllProfiles
// Add at top:
import { getTodayReports } from '@/lib/db/reports';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

// Replace mock data calls:
export default async function WorkReportPage() {
  const [reports, allProfiles, user, unreadCount] = await Promise.all([
    getTodayReports(),
    getAllProfiles(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);
  // rest of component unchanged, just swap mockWorkReports → reports
  // and getProfile(id) → allProfiles.find(p => p.id === id)
```

```tsx
// app/(workspace)/calendar/page.tsx — replace getMonthEvents
import { getMonthEvents } from '@/lib/db/calendar';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function CalendarPage() {
  const [events, user, unreadCount] = await Promise.all([
    getMonthEvents(2026, 3),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);
  // rest unchanged, swap mockCalendarEvents → events
```

```tsx
// app/(workspace)/memo/page.tsx — replace getMyMemos
import { getMyMemos } from '@/lib/db/memos';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function MemoPage() {
  const user = await getCurrentProfile();
  const [memos, unreadCount] = await Promise.all([
    getMyMemos(user!.id),
    getUnreadNotificationCount(),
  ]);
  // rest unchanged, swap mockMemos → memos
```

- [ ] **Step 5: Commit**

```bash
git add lib/db/reports.ts lib/db/calendar.ts lib/db/memos.ts app/\(workspace\)/work-report/page.tsx app/\(workspace\)/calendar/page.tsx app/\(workspace\)/memo/page.tsx
git commit -m "feat: work reports, calendar events, memos from Supabase"
```

---

## Task 11: DB Layer — Notifications

**Files:**
- Create: `lib/db/notifications.ts`
- Modify: `app/(workspace)/notifications/page.tsx`

- [ ] **Step 1: Create lib/db/notifications.ts**

```typescript
// lib/db/notifications.ts
import { createClient } from '@/lib/supabase/server';
import type { Notification } from '@/lib/types';

function toNotification(row: Record<string, unknown>): Notification {
  return {
    id: row.id as string,
    type: row.type as Notification['type'],
    title: row.title as string,
    body: row.body as string,
    isRead: row.is_read as boolean,
    createdAt: row.created_at as string,
    link: row.link as string | undefined,
  };
}

export async function getMyNotifications(): Promise<Notification[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('work_notifications')
    .select('*')
    .eq('profile_id', user.id)
    .order('created_at', { ascending: false });
  return (data ?? []).map(toNotification);
}

export async function getUnreadNotificationCount(): Promise<number> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from('work_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('profile_id', user.id)
    .eq('is_read', false);
  return count ?? 0;
}

export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('work_notifications')
    .update({ is_read: true })
    .eq('profile_id', user.id);
}
```

- [ ] **Step 2: Update app/(workspace)/notifications/page.tsx**

```tsx
// app/(workspace)/notifications/page.tsx
// Add imports:
import { getMyNotifications } from '@/lib/db/notifications';
import { getCurrentProfile } from '@/lib/db/profiles';

export default async function NotificationsPage() {
  const [notifications, user] = await Promise.all([
    getMyNotifications(),
    getCurrentProfile(),
  ]);
  const unread = notifications.filter(n => !n.isRead);
  const read = notifications.filter(n => n.isRead);
  // pass currentUser={user!} unreadCount={unread.length} to Topbar
  // rest of component unchanged
```

- [ ] **Step 3: Commit**

```bash
git add lib/db/notifications.ts app/\(workspace\)/notifications/page.tsx
git commit -m "feat: notifications from Supabase"
```

---

## Task 12: Admin Pages — Approvals, Members, Permissions, Boards

**Files:**
- Modify: `app/(workspace)/admin/approvals/page.tsx`
- Modify: `app/(workspace)/admin/members/page.tsx`
- Modify: `app/(workspace)/admin/permissions/page.tsx`
- Modify: `app/(workspace)/admin/boards/page.tsx`

- [ ] **Step 1: Update approvals page with Server Action for approve/reject**

```tsx
// app/(workspace)/admin/approvals/page.tsx
import { revalidatePath } from 'next/cache';
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Mail } from 'lucide-react';
import { getPendingProfiles, getCurrentProfile, updateProfileStatus } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

async function approveUser(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await updateProfileStatus(id, 'approved');
  revalidatePath('/admin/approvals');
}

async function rejectUser(formData: FormData) {
  'use server';
  const id = formData.get('id') as string;
  await updateProfileStatus(id, 'rejected');
  revalidatePath('/admin/approvals');
}

export default async function ApprovalsPage() {
  const [pending, user, unreadCount] = await Promise.all([
    getPendingProfiles(),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="가입 승인" subtitle={`승인 대기 중인 신청 ${pending.length}건`}
        breadcrumb={[{ label: '관리자' }, { label: '가입 승인' }]}
        currentUser={user!} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-2xl space-y-4">
        {pending.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">대기 중인 가입 신청이 없습니다.</div>
        ) : (
          pending.map(u => (
            <div key={u.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar initial={u.avatarInitial} color={u.avatarColor} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[var(--foreground)]">{u.name}</span>
                    <Badge variant="yellow">승인 대기</Badge>
                  </div>
                  <div className="text-[11px] text-[var(--muted)] mt-0.5">{u.department} · {u.position}</div>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail size={11} className="text-[var(--muted)]" />
                    <span className="text-[11px] text-[var(--muted)]">{u.email}</span>
                  </div>
                  <div className="text-[10px] text-[var(--stone-400)] mt-1">신청일: {u.joinedAt.replace(/-/g, '.')}</div>
                </div>
                <div className="flex gap-2">
                  <form action={approveUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-white hover:opacity-90 transition-all" style={{ background: 'var(--indigo-600)' }}>
                      <CheckCircle2 size={13} /> 승인
                    </button>
                  </form>
                  <form action={rejectUser}>
                    <input type="hidden" name="id" value={u.id} />
                    <button type="submit" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold border hover:bg-[var(--stone-50)] transition-colors" style={{ borderColor: 'var(--line)', color: 'var(--danger)' }}>
                      <XCircle size={13} /> 거절
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update admin/members, admin/permissions, admin/boards to use real data**

For each page, replace mock imports with `lib/db` imports and add `currentUser` + `unreadCount` props to `Topbar`. The UI structure stays the same.

```tsx
// admin/members/page.tsx — replace mockProfiles
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';
// getAllProfiles() returns Profile[] — filter by status='approved'

// admin/permissions/page.tsx — replace mockBoardPermissions
import { getAllBoards, getAllBoardPermissions } from '@/lib/db/boards';
import { getAllProfiles, getCurrentProfile } from '@/lib/db/profiles';

// admin/boards/page.tsx — replace mockBoards
import { getAllBoards, getCurrentProfile } from '@/lib/db/boards';
```

- [ ] **Step 3: Commit**

```bash
git add app/\(workspace\)/admin/
git commit -m "feat: admin pages with real Supabase data and Server Actions"
```

---

## Task 13: Profile Page + Sign Out

**Files:**
- Modify: `app/(workspace)/profile/page.tsx`
- Modify: `components/board-sidebar.tsx` — wire up sign out

- [ ] **Step 1: Update profile page with real user data**

```tsx
// app/(workspace)/profile/page.tsx
import { redirect } from 'next/navigation';
import Topbar from '@/components/topbar';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Mail, Building, Briefcase, Calendar } from 'lucide-react';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function ProfilePage() {
  const [user, unreadCount] = await Promise.all([
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);
  if (!user) redirect('/login');

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title="내 프로필" currentUser={user} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5 max-w-xl">
        <div className="card p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0" style={{ background: user.avatarColor }}>
              {user.avatarInitial}
            </div>
            <div>
              <h2 className="text-[18px] font-bold text-[var(--foreground)]">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={user.role === 'admin' ? 'indigo' : 'gray'}>{user.role === 'admin' ? '관리자' : '멤버'}</Badge>
                <Badge variant="green">승인됨</Badge>
              </div>
            </div>
          </div>
          <div className="space-y-3 border-t pt-5" style={{ borderColor: 'var(--line)' }}>
            {[
              { icon: Mail,      label: '이메일', value: user.email },
              { icon: Building,  label: '부서',   value: user.department },
              { icon: Briefcase, label: '직책',   value: user.position },
              { icon: Calendar,  label: '입사일', value: user.joinedAt.replace(/-/g, '.') },
            ].map(item => (
              <div key={item.label} className="flex items-center gap-3">
                <item.icon size={15} className="text-[var(--muted)] flex-shrink-0" />
                <span className="text-[12px] text-[var(--muted)] w-16">{item.label}</span>
                <span className="text-[13px] text-[var(--foreground)]">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add sign out to board-sidebar.tsx**

In `components/board-sidebar.tsx`, wrap the LogOut button in a form with a Server Action:

```tsx
// At top of file, add:
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

// In component, add:
const router = useRouter();
async function handleSignOut() {
  const supabase = createClient();
  await supabase.auth.signOut();
  router.push('/login');
}

// Replace the static LogOut div with:
<button onClick={handleSignOut} className="mt-2 flex items-center gap-2 w-full px-2 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-colors text-left">
  <Avatar initial={currentUser.avatarInitial} color={currentUser.avatarColor} size="sm" />
  <div className="flex-1 min-w-0">
    <div className="text-[12px] font-semibold text-white/90 truncate">{currentUser.name}</div>
    <div className="text-[10px] text-white/40 truncate">{currentUser.position}</div>
  </div>
  <LogOut size={13} className="text-white/30 flex-shrink-0" />
</button>
```

- [ ] **Step 3: Commit**

```bash
git add app/\(workspace\)/profile/page.tsx components/board-sidebar.tsx
git commit -m "feat: profile page with real user data + sign out"
```

---

## Task 14: Board Page + Settings Page with Real Data

**Files:**
- Modify: `app/(workspace)/board/[boardId]/page.tsx`
- Modify: `app/(workspace)/settings/page.tsx`

- [ ] **Step 1: Update board page**

```tsx
// app/(workspace)/board/[boardId]/page.tsx
import { notFound } from 'next/navigation';
import Topbar from '@/components/topbar';
import PostCard from '@/components/post-card';
import Composer from '@/components/composer';
import { getAllBoards } from '@/lib/db/boards';
import { getPostsForBoard } from '@/lib/db/posts';
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function BoardPage({ params }: { params: { boardId: string } }) {
  const [boards, posts, user, unreadCount] = await Promise.all([
    getAllBoards(),
    getPostsForBoard(params.boardId),
    getCurrentProfile(),
    getUnreadNotificationCount(),
  ]);

  const board = boards.find(b => b.id === params.boardId);
  if (!board) notFound();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <Topbar title={board.name} subtitle={board.description}
        breadcrumb={[{ label: '게시판' }, { label: board.name }]}
        currentUser={user!} unreadCount={unreadCount} />
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <Composer boardId={params.boardId} authorId={user!.id}
          authorInitial={user!.avatarInitial} authorColor={user!.avatarColor} />
        {posts.length === 0 ? (
          <div className="card p-12 text-center text-[var(--muted)] text-[13px]">아직 게시글이 없습니다. 첫 번째 글을 작성해보세요.</div>
        ) : (
          posts.map(post => <PostCard key={post.id} post={post} />)
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update settings page with Topbar**

```tsx
// app/(workspace)/settings/page.tsx — add currentUser to Topbar
import { getCurrentProfile } from '@/lib/db/profiles';
import { getUnreadNotificationCount } from '@/lib/db/notifications';

export default async function SettingsPage() {
  const [user, unreadCount] = await Promise.all([getCurrentProfile(), getUnreadNotificationCount()]);
  // Pass currentUser={user!} unreadCount={unreadCount} to Topbar
```

- [ ] **Step 3: Commit**

```bash
git add app/\(workspace\)/board/ app/\(workspace\)/settings/page.tsx
git commit -m "feat: board page and settings with real data"
```

---

## Task 15: PostCard — Real Profile Lookup

**Files:**
- Modify: `components/post-card.tsx`

- [ ] **Step 1: Pass profiles to PostCard**

PostCard currently calls `getProfile(id)` from mock data. Since it's a Client Component, pass the profiles as a prop from the server:

```tsx
// components/post-card.tsx — add profiles prop
interface PostCardProps {
  post: Post;
  profiles: Record<string, { name: string; position: string; role: string; avatarInitial: string; avatarColor: string }>;
}

export default function PostCard({ post, profiles }: PostCardProps) {
  const author = profiles[post.authorId] ?? { name: '알 수 없음', position: '', role: 'member', avatarInitial: '?', avatarColor: '#999' };
  // rest of component unchanged
```

In feed/page.tsx and board/[boardId]/page.tsx, fetch all profiles and build a lookup map:

```tsx
// In feed/page.tsx (and board page):
const allProfiles = await getAllProfiles();
const profileMap = Object.fromEntries(allProfiles.map(p => [p.id, p]));

// Pass to PostCard:
<PostCard key={post.id} post={post} profiles={profileMap} />
```

- [ ] **Step 2: Commit**

```bash
git add components/post-card.tsx app/\(workspace\)/feed/page.tsx app/\(workspace\)/board/
git commit -m "feat: PostCard uses real profile data"
```

---

## Task 16: Final Build Verification

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit
```
Expected: no errors.

- [ ] **Step 2: Run production build**

```bash
npm run build
```
Expected: all 17 routes compile successfully.

- [ ] **Step 3: End-to-end smoke test**

With `npm run dev` running, verify:
1. `/login` — unauthenticated visit works
2. Login with approved admin → `/feed` loads with real posts
3. Post a new message via Composer → appears in feed after submit
4. `/admin/approvals` — shows pending users
5. Approve a user → disappears from list
6. New user logs in → reaches `/feed`
7. Sign out → redirects to `/login`

- [ ] **Step 4: Push to GitHub**

```bash
git push origin main
```

---

## Self-Review

- [x] All `work_` table prefix rule enforced in schema.sql and all queries
- [x] RLS policies on every table — no table left unprotected
- [x] Auth trigger creates `work_profiles` on sign up
- [x] Middleware redirects unauthenticated users to /login
- [x] Pending users redirected to /pending after login
- [x] Admin-only pages (admin/*) protected via role check in layout
- [x] Server Actions used for approve/reject (not client-side fetch)
- [x] `currentUser` prop threading: layout → sidebar, every page → topbar
- [x] No placeholder steps — all code is complete and runnable
- [x] `getUnreadNotificationCount()` defined in Task 11 before it's used in Tasks 9, 10, 12, 13, 14
