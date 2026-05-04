-- Re-runnable WIL collaboration schema.
-- This migration is intentionally idempotent because early setup used SQL Editor directly.

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

create table if not exists work_boards (
  id text primary key,
  name text not null,
  description text not null default '',
  icon text not null default 'Bell',
  is_public boolean not null default false,
  display_order integer not null default 1000,
  created_at timestamptz not null default now()
);

create table if not exists work_board_permissions (
  profile_id uuid references work_profiles(id) on delete cascade,
  board_id text references work_boards(id) on delete cascade,
  primary key (profile_id, board_id)
);

create table if not exists work_posts (
  id uuid primary key default gen_random_uuid(),
  board_id text references work_boards(id) on delete cascade not null,
  author_id uuid references work_profiles(id) on delete cascade not null,
  title text,
  content text not null default '',
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists work_attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references work_posts(id) on delete cascade not null,
  name text not null,
  size text not null,
  type text not null default 'other',
  storage_path text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists work_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references work_posts(id) on delete cascade not null,
  author_id uuid references work_profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamptz not null default now()
);

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

create unique index if not exists work_reports_author_date_key
  on work_reports(author_id, date);

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

insert into work_boards (id, name, description, icon, is_public) values
  ('feed',      '전체 피드',  '모든 팀원의 소식을 확인하세요', 'LayoutDashboard', true),
  ('sales',     '영업팀',    '영업팀 전용 게시판',            'TrendingUp',      false),
  ('dev',       '개발팀',    '개발팀 이슈 및 공유',           'Code2',           false),
  ('marketing', '마케팅',    '마케팅 캠페인 및 콘텐츠',       'Megaphone',       false),
  ('notice',    '공지사항',  '전사 공지',                     'Bell',            true)
on conflict (id) do nothing;

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

create or replace function is_work_admin()
returns boolean language sql security definer as $$
  select exists (
    select 1 from work_profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function is_work_approved()
returns boolean language sql security definer as $$
  select exists (
    select 1 from work_profiles
    where id = auth.uid() and status = 'approved'
  );
$$;

drop policy if exists "Approved users can read all profiles" on work_profiles;
create policy "Approved users can read all profiles" on work_profiles for select using (is_work_approved());
drop policy if exists "Users can update own profile" on work_profiles;
create policy "Users can update own profile" on work_profiles for update using (id = auth.uid());
drop policy if exists "Admins can update any profile" on work_profiles;
create policy "Admins can update any profile" on work_profiles for update using (is_work_admin());
drop policy if exists "Users can insert own profile" on work_profiles;
create policy "Users can insert own profile" on work_profiles for insert with check (id = auth.uid());

drop policy if exists "Approved users can read all boards" on work_boards;
create policy "Approved users can read all boards" on work_boards for select using (is_work_approved());
drop policy if exists "Admins can insert boards" on work_boards;
create policy "Admins can insert boards" on work_boards for insert with check (is_work_admin());
drop policy if exists "Admins can update boards" on work_boards;
create policy "Admins can update boards" on work_boards for update using (is_work_admin());

drop policy if exists "Approved users can read permissions" on work_board_permissions;
create policy "Approved users can read permissions" on work_board_permissions for select using (is_work_approved());
drop policy if exists "Admins can manage permissions" on work_board_permissions;
create policy "Admins can manage permissions" on work_board_permissions for all using (is_work_admin());

drop policy if exists "Users can read posts on accessible boards" on work_posts;
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
drop policy if exists "Approved users can insert posts" on work_posts;
create policy "Approved users can insert posts" on work_posts for insert with check (is_work_approved() and author_id = auth.uid());
drop policy if exists "Authors can update own posts" on work_posts;
create policy "Authors can update own posts" on work_posts for update using (author_id = auth.uid() or is_work_admin());

drop policy if exists "Users can read attachments on accessible posts" on work_attachments;
create policy "Users can read attachments on accessible posts" on work_attachments for select using (is_work_approved());
drop policy if exists "Authors can insert attachments" on work_attachments;
create policy "Authors can insert attachments" on work_attachments for insert with check (is_work_approved());

drop policy if exists "Users can read comments on accessible posts" on work_comments;
create policy "Users can read comments on accessible posts" on work_comments for select using (is_work_approved());
drop policy if exists "Approved users can insert comments" on work_comments;
create policy "Approved users can insert comments" on work_comments for insert with check (is_work_approved() and author_id = auth.uid());

drop policy if exists "Users can read all reports" on work_reports;
create policy "Users can read all reports" on work_reports for select using (is_work_approved());
drop policy if exists "Users can insert own reports" on work_reports;
create policy "Users can insert own reports" on work_reports for insert with check (is_work_approved() and author_id = auth.uid());
drop policy if exists "Users can update own reports" on work_reports;
create policy "Users can update own reports" on work_reports for update using (author_id = auth.uid() or is_work_admin());

drop policy if exists "Approved users can read all events" on work_calendar_events;
create policy "Approved users can read all events" on work_calendar_events for select using (is_work_approved());
drop policy if exists "Approved users can insert events" on work_calendar_events;
create policy "Approved users can insert events" on work_calendar_events for insert with check (is_work_approved());
drop policy if exists "Creator or admin can update events" on work_calendar_events;
create policy "Creator or admin can update events" on work_calendar_events for update using (created_by = auth.uid() or is_work_admin());

drop policy if exists "Users can read own memos" on work_memos;
create policy "Users can read own memos" on work_memos for select using (author_id = auth.uid());
drop policy if exists "Users can insert own memos" on work_memos;
create policy "Users can insert own memos" on work_memos for insert with check (author_id = auth.uid());
drop policy if exists "Users can update own memos" on work_memos;
create policy "Users can update own memos" on work_memos for update using (author_id = auth.uid());
drop policy if exists "Users can delete own memos" on work_memos;
create policy "Users can delete own memos" on work_memos for delete using (author_id = auth.uid());

drop policy if exists "Users can read own notifications" on work_notifications;
create policy "Users can read own notifications" on work_notifications for select using (profile_id = auth.uid());
drop policy if exists "Users can update own notifications" on work_notifications;
create policy "Users can update own notifications" on work_notifications for update using (profile_id = auth.uid());

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

insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists "Approved users can upload attachments" on storage.objects;
create policy "Approved users can upload attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and is_work_approved());

drop policy if exists "Approved users can read attachments" on storage.objects;
create policy "Approved users can read attachments"
  on storage.objects for select
  using (bucket_id = 'attachments' and is_work_approved());
