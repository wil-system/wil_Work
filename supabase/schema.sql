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
  display_order integer not null default 1000,
  created_at timestamptz not null default now()
);

-- Board permissions (which members can access which non-public boards)
create table if not exists work_board_permissions (
  profile_id uuid references work_profiles(id) on delete cascade,
  board_id text references work_boards(id) on delete cascade,
  board_role text not null default 'member' check (board_role in ('leader', 'member')),
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
  work_status text check (work_status is null or work_status in ('in_progress', 'completed', 'on_hold')),
  assignee_id uuid references work_profiles(id) on delete set null,
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
  board_id text references work_boards(id) on delete cascade,
  date date not null default current_date,
  period_start date not null default current_date,
  period_end date not null default current_date,
  period_label text not null default '',
  period_type text not null default 'day' check (period_type in ('day', 'week', 'month', 'custom')),
  goals text[] not null default '{}',
  progress text[] not null default '{}',
  planned_tasks text[] not null default '{}',
  completed_tasks text[] not null default '{}',
  issues text,
  next_plan text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'submitted', 'reviewed')),
  review_status text not null default 'draft' check (review_status in ('draft', 'submitted', 'reviewed', 'changes_requested')),
  previous_report_id uuid references work_reports(id) on delete set null,
  recipient_id uuid references work_profiles(id) on delete set null,
  reviewer_id uuid references work_profiles(id) on delete set null,
  review_comment text,
  reviewed_at timestamptz,
  updated_at timestamptz not null default now(),
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
  created_by uuid default auth.uid() references work_profiles(id) on delete set null,
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

create table if not exists work_notification_settings (
  profile_id uuid primary key references work_profiles(id) on delete cascade,
  comment_notifications boolean not null default true,
  approval_notifications boolean not null default true,
  badge_notifications boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- ── Seed: default boards ──────────────────────────────────────
insert into work_boards (id, name, description, icon, is_public, display_order) values
  ('feed',      '전체 피드',  '모든 팀원의 소식을 확인하세요', 'LayoutDashboard', true, 0),
  ('notice',    '공지사항',  '전사 공지',                     'Bell',            true, 1),
  ('sales',     '영업팀',    '영업팀 전용 게시판',            'TrendingUp',      false, 2),
  ('dev',       '개발팀',    '개발팀 이슈 및 공유',           'Code2',           false, 3),
  ('marketing', '마케팅',    '마케팅 캠페인 및 콘텐츠',       'Megaphone',       false, 4)
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
alter table work_notification_settings enable row level security;

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

create or replace function is_work_board_leader(p_board_id text)
returns boolean language sql security definer as $$
  select exists (
    select 1 from work_board_permissions
    where profile_id = auth.uid()
      and board_id = p_board_id
      and board_role = 'leader'
  );
$$;

create or replace function is_work_report_reviewer(p_board_id text, p_author_id uuid)
returns boolean language sql security definer as $$
  select auth.uid() is not null
    and auth.uid() <> p_author_id
    and (
      is_work_admin()
      or (
        is_work_board_leader(p_board_id)
        and not exists (
          select 1 from work_profiles author
          where author.id = p_author_id
            and author.role = 'admin'
        )
        and not exists (
          select 1 from work_board_permissions author_permission
          where author_permission.profile_id = p_author_id
            and author_permission.board_id = p_board_id
            and author_permission.board_role = 'leader'
        )
      )
    );
$$;

create or replace function get_feed_post_counts_by_day()
returns table(date date, count bigint)
language sql
security definer
as $$
  select (created_at at time zone 'Asia/Seoul')::date as date, count(*) as count
  from work_posts
  where board_id = 'feed'
  group by 1
  order by 1;
$$;

create or replace function public.create_feed_mention_notifications(
  p_post_id uuid,
  p_content text
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_board_id text;
  v_board_name text;
  v_surface_name text;
  v_link text;
  v_inserted integer := 0;
begin
  if v_actor_id is null or coalesce(trim(p_content), '') = '' then
    return 0;
  end if;

  select name
    into v_actor_name
  from public.work_profiles
  where id = v_actor_id
    and status = 'approved';

  if v_actor_name is null then
    return 0;
  end if;

  select post.board_id, board.name
    into v_board_id, v_board_name
  from public.work_posts post
  left join public.work_boards board on board.id = post.board_id
  where post.id = p_post_id;

  if v_board_id is null then
    return 0;
  end if;

  v_link := case
    when v_board_id = 'feed' then '/feed?post=' || p_post_id::text
    else '/board/' || v_board_id || '?post=' || p_post_id::text
  end;
  v_surface_name := case
    when v_board_id = 'feed' then '피드'
    else coalesce(nullif(v_board_name, ''), '게시판') || ' 게시판'
  end;

  insert into public.work_notifications (profile_id, type, title, body, link)
  select
    mentioned.id,
    'mention',
    '새 멘션',
    v_actor_name || '님이 ' || v_surface_name || '에서 회원님을 언급했습니다.',
    v_link
  from public.work_profiles mentioned
  where mentioned.id <> v_actor_id
    and mentioned.status = 'approved'
    and position('@' || mentioned.name in p_content) > 0
    and not exists (
      select 1
      from public.work_notifications existing
      where existing.profile_id = mentioned.id
        and existing.type = 'mention'
        and existing.link = v_link
    );

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.create_comment_notifications(
  p_comment_id uuid
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid := auth.uid();
  v_actor_name text;
  v_post_id uuid;
  v_post_author_id uuid;
  v_board_id text;
  v_link text;
  v_inserted integer := 0;
begin
  if v_actor_id is null then
    return 0;
  end if;

  select
    work_comment.post_id,
    work_comment.author_id,
    actor.name,
    post.author_id,
    post.board_id
  into v_post_id, v_actor_id, v_actor_name, v_post_author_id, v_board_id
  from public.work_comments work_comment
  join public.work_profiles actor on actor.id = work_comment.author_id
  join public.work_posts post on post.id = work_comment.post_id
  where work_comment.id = p_comment_id
    and work_comment.author_id = auth.uid()
    and actor.status = 'approved';

  if v_post_id is null or v_post_author_id is null or v_post_author_id = v_actor_id then
    return 0;
  end if;

  v_link := case
    when v_board_id = 'feed' then '/feed?post=' || v_post_id::text || '&comment=' || p_comment_id::text
    else '/board/' || v_board_id || '?post=' || v_post_id::text || '&comment=' || p_comment_id::text
  end;

  insert into public.work_notifications (profile_id, type, title, body, link)
  select
    recipient.id,
    'comment',
    '새 댓글',
    v_actor_name || '님이 회원님의 게시글에 댓글을 남겼습니다.',
    v_link
  from public.work_profiles recipient
  left join public.work_notification_settings settings on settings.profile_id = recipient.id
  where recipient.id = v_post_author_id
    and recipient.status = 'approved'
    and coalesce(settings.comment_notifications, true) = true
    and not exists (
      select 1
      from public.work_notifications existing
      where existing.profile_id = recipient.id
        and existing.type = 'comment'
        and existing.link = v_link
    );

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

create or replace function public.create_report_notifications(
  p_report_id uuid,
  p_event text
)
returns integer
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_actor_id uuid := auth.uid();
  v_author_id uuid;
  v_author_name text;
  v_board_id text;
  v_board_name text;
  v_period_label text;
  v_review_status text;
  v_recipient_id uuid;
  v_link text;
  v_inserted integer := 0;
begin
  if v_actor_id is null or p_event not in ('submitted', 'reviewed', 'changes_requested') then
    return 0;
  end if;

  v_link := case
    when p_event = 'submitted' then '/work-report/review?report=' || p_report_id::text
    else '/work-report?report=' || p_report_id::text
  end;

  select
    report.author_id,
    author.name,
    report.board_id,
    coalesce(board.name, '부서 미지정'),
    report.period_label,
    report.review_status,
    report.recipient_id
  into v_author_id, v_author_name, v_board_id, v_board_name, v_period_label, v_review_status, v_recipient_id
  from public.work_reports report
  join public.work_profiles author on author.id = report.author_id
  left join public.work_boards board on board.id = report.board_id
  where report.id = p_report_id;

  if v_author_id is null then
    return 0;
  end if;

  if p_event = 'submitted' then
    if v_recipient_id is not null then
      insert into public.work_notifications (profile_id, type, title, body, link)
      select recipient.id, 'report', '업무보고 제출', v_author_name || '님이 ' || v_period_label || ' 업무보고를 제출했습니다.', v_link
      from public.work_profiles recipient
      where recipient.id = v_recipient_id
        and recipient.status = 'approved'
        and recipient.id <> v_actor_id
        and not exists (
          select 1 from public.work_notifications existing
          where existing.profile_id = recipient.id
            and existing.type = 'report'
            and existing.link = v_link
            and existing.title = '업무보고 제출'
        );
    else
      insert into public.work_notifications (profile_id, type, title, body, link)
      select recipient.id, 'report', '업무보고 제출', v_author_name || '님이 ' || v_period_label || ' 업무보고를 제출했습니다.', v_link
      from public.work_profiles recipient
      where recipient.status = 'approved'
        and recipient.id <> v_actor_id
        and (
          recipient.role = 'admin'
          or exists (
            select 1 from public.work_board_permissions permission
            where permission.profile_id = recipient.id
              and permission.board_id = v_board_id
              and permission.board_role = 'leader'
          )
        )
        and not exists (
          select 1 from public.work_notifications existing
          where existing.profile_id = recipient.id
            and existing.type = 'report'
            and existing.link = v_link
            and existing.title = '업무보고 제출'
        );
    end if;
  else
    insert into public.work_notifications (profile_id, type, title, body, link)
    select
      v_author_id,
      'report',
      case when p_event = 'reviewed' then '업무보고 검토완료' else '업무보고 수정요청' end,
      v_board_name || ' ' || v_period_label || ' 업무보고 검토 상태가 변경되었습니다.',
      v_link
    where v_author_id <> v_actor_id
      and not exists (
        select 1 from public.work_notifications existing
        where existing.profile_id = v_author_id
          and existing.type = 'report'
          and existing.link = v_link
          and existing.title = case when p_event = 'reviewed' then '업무보고 검토완료' else '업무보고 수정요청' end
      );
  end if;

  get diagnostics v_inserted = row_count;
  return v_inserted;
end;
$$;

-- work_profiles
drop policy if exists "Approved users can read all profiles" on work_profiles;
create policy "Approved users can read all profiles"
  on work_profiles for select
  using (is_work_approved());

drop policy if exists "Users can update own profile" on work_profiles;
create policy "Users can update own profile"
  on work_profiles for update
  using (id = auth.uid());

drop policy if exists "Admins can update any profile" on work_profiles;
create policy "Admins can update any profile"
  on work_profiles for update
  using (is_work_admin());

drop policy if exists "Admins can delete other profiles" on work_profiles;
create policy "Admins can delete other profiles"
  on work_profiles for delete
  using (is_work_admin() and id <> auth.uid());

drop policy if exists "Users can insert own profile" on work_profiles;
create policy "Users can insert own profile"
  on work_profiles for insert
  with check (id = auth.uid());

-- work_boards
drop policy if exists "Approved users can read all boards" on work_boards;
create policy "Approved users can read all boards"
  on work_boards for select
  using (is_work_approved());

drop policy if exists "Admins can insert boards" on work_boards;
create policy "Admins can insert boards"
  on work_boards for insert
  with check (is_work_admin());

drop policy if exists "Admins can update boards" on work_boards;
create policy "Admins can update boards"
  on work_boards for update
  using (is_work_admin());
drop policy if exists "Admins can delete boards" on work_boards;
create policy "Admins can delete boards"
  on work_boards for delete
  using (is_work_admin() and id not in ('feed', 'notice'));

-- work_board_permissions
drop policy if exists "Approved users can read permissions" on work_board_permissions;
create policy "Approved users can read permissions"
  on work_board_permissions for select
  using (is_work_approved());

drop policy if exists "Admins can manage permissions" on work_board_permissions;
create policy "Admins can manage permissions"
  on work_board_permissions for all
  using (is_work_admin());

-- work_posts (users can read boards they have access to)
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
create policy "Approved users can insert posts"
  on work_posts for insert
  with check (
    is_work_approved()
    and author_id = auth.uid()
    and (board_id <> 'notice' or is_work_admin())
  );

create or replace function public.prevent_assignee_post_content_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if old.author_id = auth.uid() then
    return new;
  end if;

  if old.assignee_id = auth.uid() then
    if new.id = old.id
      and new.board_id = old.board_id
      and new.author_id = old.author_id
      and new.title is not distinct from old.title
      and new.content is not distinct from old.content
      and new.created_at = old.created_at
      and new.assignee_id is not distinct from old.assignee_id
      and new.work_status is distinct from old.work_status
      and new.is_pinned = (new.work_status = 'in_progress')
    then
      return new;
    end if;

    raise exception 'Assignees can only update work status.';
  end if;

  return new;
end;
$$;

drop trigger if exists prevent_assignee_post_content_update on public.work_posts;
create trigger prevent_assignee_post_content_update
  before update on public.work_posts
  for each row execute function public.prevent_assignee_post_content_update();

drop policy if exists "Authors can update own posts" on work_posts;
create policy "Authors can update own posts"
  on work_posts for update
  using (
    author_id = auth.uid()
    or (
      board_id <> 'feed'
      and work_status is not null
      and assignee_id = auth.uid()
    )
  )
  with check (
    author_id = auth.uid()
    or (
      board_id <> 'feed'
      and work_status is not null
      and assignee_id = auth.uid()
    )
  );

drop policy if exists "Authors can delete own posts" on work_posts;
create policy "Authors can delete own posts"
  on work_posts for delete
  using (author_id = auth.uid() or is_work_admin());

-- work_attachments
drop policy if exists "Users can read attachments on accessible posts" on work_attachments;
create policy "Users can read attachments on accessible posts"
  on work_attachments for select
  using (is_work_approved());

drop policy if exists "Authors can insert attachments" on work_attachments;
create policy "Authors can insert attachments"
  on work_attachments for insert
  with check (is_work_approved());

-- work_comments
drop policy if exists "Users can read comments on accessible posts" on work_comments;
create policy "Users can read comments on accessible posts"
  on work_comments for select
  using (is_work_approved());

drop policy if exists "Approved users can insert comments" on work_comments;
create policy "Approved users can insert comments"
  on work_comments for insert
  with check (is_work_approved() and author_id = auth.uid());

drop policy if exists "Authors can update own comments" on work_comments;
create policy "Authors can update own comments"
  on work_comments for update
  using (author_id = auth.uid() or is_work_admin())
  with check (author_id = auth.uid() or is_work_admin());

drop policy if exists "Authors can delete own comments" on work_comments;
create policy "Authors can delete own comments"
  on work_comments for delete
  using (author_id = auth.uid() or is_work_admin());

-- work_reports
drop policy if exists "Users can read all reports" on work_reports;
drop policy if exists "Users can read accessible reports" on work_reports;
create policy "Users can read accessible reports"
  on work_reports for select
  using (
    is_work_approved()
    and (
      author_id = auth.uid()
      or recipient_id = auth.uid()
    )
  );

drop policy if exists "Users can insert own reports" on work_reports;
create policy "Users can insert own reports"
  on work_reports for insert
  with check (
    is_work_approved()
    and author_id = auth.uid()
    and (
      board_id is null
      or (
        board_id <> 'notice'
        and (
          is_work_admin()
          or (select is_public from work_boards where id = board_id) = true
          or exists (
            select 1 from work_board_permissions
            where profile_id = auth.uid() and board_id = work_reports.board_id
          )
        )
      )
    )
    and (
      recipient_id is null
      or exists (
        select 1 from work_profiles recipient
        where recipient.id = work_reports.recipient_id
          and recipient.status = 'approved'
          and recipient.id <> auth.uid()
      )
    )
  );

drop policy if exists "Users can update own reports" on work_reports;
drop policy if exists "Users can update accessible reports" on work_reports;
create policy "Users can update accessible reports"
  on work_reports for update
  using (
    is_work_approved()
    and (
      (author_id = auth.uid() and review_status in ('draft', 'submitted', 'changes_requested'))
      or recipient_id = auth.uid()
    )
  )
  with check (
    is_work_approved()
    and (
      author_id = auth.uid()
      or recipient_id = auth.uid()
    )
  );

-- work_calendar_events
drop policy if exists "Approved users can read all events" on work_calendar_events;
drop policy if exists "Users can read own events" on work_calendar_events;
create policy "Users can read own events"
  on work_calendar_events for select
  to authenticated
  using (is_work_approved() and created_by = auth.uid());

drop policy if exists "Approved users can insert events" on work_calendar_events;
drop policy if exists "Users can insert own events" on work_calendar_events;
create policy "Users can insert own events"
  on work_calendar_events for insert
  to authenticated
  with check (is_work_approved() and created_by = auth.uid());

drop policy if exists "Creator or admin can update events" on work_calendar_events;
drop policy if exists "Users can update own events" on work_calendar_events;
create policy "Users can update own events"
  on work_calendar_events for update
  to authenticated
  using (is_work_approved() and created_by = auth.uid())
  with check (is_work_approved() and created_by = auth.uid());

-- work_memos
drop policy if exists "Users can read own memos" on work_memos;
create policy "Users can read own memos"
  on work_memos for select
  using (author_id = auth.uid());

drop policy if exists "Users can insert own memos" on work_memos;
create policy "Users can insert own memos"
  on work_memos for insert
  with check (author_id = auth.uid());

drop policy if exists "Users can update own memos" on work_memos;
create policy "Users can update own memos"
  on work_memos for update
  using (author_id = auth.uid());

drop policy if exists "Users can delete own memos" on work_memos;
create policy "Users can delete own memos"
  on work_memos for delete
  using (author_id = auth.uid());

-- work_notifications
drop policy if exists "Users can read own notifications" on work_notifications;
create policy "Users can read own notifications"
  on work_notifications for select
  using (profile_id = auth.uid());

drop policy if exists "Users can update own notifications" on work_notifications;
create policy "Users can update own notifications"
  on work_notifications for update
  using (profile_id = auth.uid());

drop policy if exists "Users can delete own read notifications" on work_notifications;
create policy "Users can delete own read notifications"
  on work_notifications for delete
  using (profile_id = auth.uid() and is_read = true);

drop policy if exists "Users can read own notification settings" on work_notification_settings;
create policy "Users can read own notification settings"
  on work_notification_settings for select
  using (profile_id = auth.uid());

drop policy if exists "Users can insert own notification settings" on work_notification_settings;
create policy "Users can insert own notification settings"
  on work_notification_settings for insert
  with check (profile_id = auth.uid());

drop policy if exists "Users can update own notification settings" on work_notification_settings;
create policy "Users can update own notification settings"
  on work_notification_settings for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

-- ── Auth trigger: create work_profiles on sign up ─────────────
create or replace function handle_new_work_user()
returns trigger language plpgsql security definer
set search_path = public, auth
as $$
declare
  v_name text;
begin
  v_name := coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1));

  insert into public.work_profiles (id, name, email, department, position, avatar_initial, avatar_color)
  values (
    new.id,
    v_name,
    new.email,
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'position', ''),
    coalesce(new.raw_user_meta_data->>'avatar_initial', upper(substr(v_name, 1, 1))),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#1e1b4b')
  );

  insert into public.work_notification_settings (profile_id)
  values (new.id)
  on conflict (profile_id) do nothing;

  insert into public.work_notifications (profile_id, type, title, body, link)
  select
    admin.id,
    'approval',
    '가입 승인 대기',
    v_name || '님이 회원가입을 신청했습니다. 승인이 필요합니다.',
    '/admin/approvals'
  from public.work_profiles admin
  left join public.work_notification_settings settings on settings.profile_id = admin.id
  where admin.role = 'admin'
    and admin.status = 'approved'
    and coalesce(settings.approval_notifications, true) = true;

  return new;
end;
$$;

drop trigger if exists on_work_auth_user_created on auth.users;
create trigger on_work_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_work_user();

-- ── Storage: post attachments ────────────────────────────────
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

update storage.buckets
set
  file_size_limit = 52428800,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'application/pdf',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-7z-compressed',
    'application/vnd.rar',
    'application/octet-stream'
  ]::text[]
where id = 'attachments';

drop policy if exists "Approved users can upload attachments" on storage.objects;
create policy "Approved users can upload attachments"
  on storage.objects for insert
  with check (bucket_id = 'attachments' and is_work_approved());

drop policy if exists "Approved users can read attachments" on storage.objects;
create policy "Approved users can read attachments"
  on storage.objects for select
  using (bucket_id = 'attachments' and is_work_approved());
