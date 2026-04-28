create type public.board_kind as enum ('company', 'team', 'worklog', 'memo');
create type public.post_status as enum ('in_progress', 'done', 'hold', 'shared');
create type public.notification_event as enum ('mention', 'comment', 'post_update', 'worklog_created');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  role text not null default 'member',
  team_id uuid,
  created_at timestamptz not null default now()
);

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  leader_id uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_team_id_fkey
  foreign key (team_id) references public.teams(id);

create table public.boards (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references public.teams(id),
  name text not null,
  kind public.board_kind not null,
  description text,
  is_pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  board_id uuid not null references public.boards(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  title text not null default '',
  body text not null,
  status public.post_status not null default 'shared',
  is_important boolean not null default false,
  is_pinned boolean not null default false,
  tags text[] not null default '{}',
  mention_profile_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  body text not null,
  mention_profile_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  constraint comments_max_depth check (parent_id is null or parent_id <> id)
);

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  file_name text not null,
  storage_path text not null,
  mime_type text,
  size_bytes bigint,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  constraint attachments_owner_check check (
    (post_id is not null and comment_id is null)
    or (post_id is null and comment_id is not null)
  )
);

create table public.worklogs (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  goals text not null default '',
  progress text not null default '',
  issues text not null default '',
  next_plan text not null default '',
  diff_summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.memos (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text not null,
  checklist jsonb not null default '[]'::jsonb,
  converted_post_id uuid references public.posts(id),
  is_important boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  post_id uuid references public.posts(id) on delete cascade,
  comment_id uuid references public.comments(id) on delete cascade,
  event public.notification_event not null,
  title text not null,
  is_read boolean not null default false,
  is_important boolean not null default false,
  created_at timestamptz not null default now()
);

create index posts_board_updated_idx on public.posts (board_id, updated_at desc);
create index posts_tags_idx on public.posts using gin (tags);
create index comments_post_created_idx on public.comments (post_id, created_at);
create index notifications_recipient_read_idx on public.notifications (recipient_id, is_read, created_at desc);

alter table public.profiles enable row level security;
alter table public.teams enable row level security;
alter table public.boards enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.attachments enable row level security;
alter table public.worklogs enable row level security;
alter table public.memos enable row level security;
alter table public.notifications enable row level security;

create policy "Profiles are readable by signed-in users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Teams are readable by signed-in users"
  on public.teams for select
  to authenticated
  using (true);

create policy "Boards are readable by signed-in users"
  on public.boards for select
  to authenticated
  using (true);

create policy "Posts are readable by signed-in users"
  on public.posts for select
  to authenticated
  using (true);

create policy "Authors can create posts"
  on public.posts for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "Authors can update their posts"
  on public.posts for update
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Comments are readable by signed-in users"
  on public.comments for select
  to authenticated
  using (true);

create policy "Authors can create comments"
  on public.comments for insert
  to authenticated
  with check (author_id = auth.uid());

create policy "Users manage their own memos"
  on public.memos for all
  to authenticated
  using (author_id = auth.uid())
  with check (author_id = auth.uid());

create policy "Users read their own notifications"
  on public.notifications for select
  to authenticated
  using (recipient_id = auth.uid());
