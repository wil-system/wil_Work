create table if not exists public.work_notification_settings (
  profile_id uuid primary key references public.work_profiles(id) on delete cascade,
  comment_notifications boolean not null default true,
  approval_notifications boolean not null default true,
  badge_notifications boolean not null default true,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

insert into public.work_notification_settings (profile_id)
select id from public.work_profiles
on conflict (profile_id) do nothing;

alter table public.work_notification_settings enable row level security;

drop policy if exists "Users can read own notification settings" on public.work_notification_settings;
create policy "Users can read own notification settings"
  on public.work_notification_settings for select
  using (profile_id = auth.uid());

drop policy if exists "Users can insert own notification settings" on public.work_notification_settings;
create policy "Users can insert own notification settings"
  on public.work_notification_settings for insert
  with check (profile_id = auth.uid());

drop policy if exists "Users can update own notification settings" on public.work_notification_settings;
create policy "Users can update own notification settings"
  on public.work_notification_settings for update
  using (profile_id = auth.uid())
  with check (profile_id = auth.uid());

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
  v_link text := '/work-report?report=' || p_report_id::text;
  v_inserted integer := 0;
begin
  if v_actor_id is null or p_event not in ('submitted', 'reviewed', 'changes_requested') then
    return 0;
  end if;

  select
    report.author_id,
    author.name,
    report.board_id,
    board.name,
    report.period_label,
    report.review_status
  into v_author_id, v_author_name, v_board_id, v_board_name, v_period_label, v_review_status
  from public.work_reports report
  join public.work_profiles author on author.id = report.author_id
  join public.work_boards board on board.id = report.board_id
  where report.id = p_report_id;

  if v_author_id is null then
    return 0;
  end if;

  if p_event = 'submitted' then
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

create or replace function public.handle_new_work_user()
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

