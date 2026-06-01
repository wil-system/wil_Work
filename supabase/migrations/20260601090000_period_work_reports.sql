-- Period-based work reports with review workflow and change summaries.

alter table work_reports
  add column if not exists board_id text references work_boards(id) on delete cascade;
alter table work_reports
  add column if not exists period_start date;
alter table work_reports
  add column if not exists period_end date;
alter table work_reports
  add column if not exists period_label text;
alter table work_reports
  add column if not exists period_type text not null default 'day' check (period_type in ('day', 'week', 'month', 'custom'));
alter table work_reports
  add column if not exists goals text[] not null default '{}';
alter table work_reports
  add column if not exists progress text[] not null default '{}';
alter table work_reports
  add column if not exists next_plan text[] not null default '{}';
alter table work_reports
  add column if not exists review_status text not null default 'draft' check (review_status in ('draft', 'submitted', 'reviewed', 'changes_requested'));
alter table work_reports
  add column if not exists previous_report_id uuid references work_reports(id) on delete set null;
alter table work_reports
  add column if not exists reviewer_id uuid references work_profiles(id) on delete set null;
alter table work_reports
  add column if not exists review_comment text;
alter table work_reports
  add column if not exists reviewed_at timestamptz;
alter table work_reports
  add column if not exists updated_at timestamptz not null default now();

update work_reports
set
  board_id = coalesce(board_id, 'feed'),
  period_start = coalesce(period_start, date),
  period_end = coalesce(period_end, date),
  period_label = coalesce(nullif(period_label, ''), to_char(date, 'YYYY-MM-DD')),
  progress = case when cardinality(progress) = 0 then completed_tasks else progress end,
  next_plan = case when cardinality(next_plan) = 0 then planned_tasks else next_plan end,
  review_status = case
    when review_status is not null then review_status
    when status = 'reviewed' then 'reviewed'
    when status = 'draft' then 'draft'
    else 'submitted'
  end,
  updated_at = coalesce(updated_at, created_at, now())
where board_id is null
  or period_start is null
  or period_end is null
  or period_label is null
  or period_label = ''
  or cardinality(progress) = 0
  or cardinality(next_plan) = 0
  or updated_at is null;

alter table work_reports
  alter column board_id set default 'feed',
  alter column board_id set not null,
  alter column period_start set default current_date,
  alter column period_start set not null,
  alter column period_end set default current_date,
  alter column period_end set not null,
  alter column period_label set default '',
  alter column period_label set not null;

drop index if exists work_reports_author_date_key;

create unique index if not exists work_reports_author_board_period_key
  on work_reports(author_id, board_id, period_start, period_end);

create or replace function is_work_board_leader(p_board_id text)
returns boolean language sql security definer as $$
  select exists (
    select 1 from work_board_permissions
    where profile_id = auth.uid()
      and board_id = p_board_id
      and board_role = 'leader'
  );
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
    report.period_label
  into v_author_id, v_author_name, v_board_id, v_board_name, v_period_label
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

drop policy if exists "Users can read all reports" on work_reports;
drop policy if exists "Users can read accessible reports" on work_reports;
create policy "Users can read accessible reports"
  on work_reports for select
  using (
    is_work_approved()
    and (
      author_id = auth.uid()
      or is_work_admin()
      or is_work_board_leader(board_id)
    )
  );

drop policy if exists "Users can insert own reports" on work_reports;
create policy "Users can insert own reports"
  on work_reports for insert
  with check (
    is_work_approved()
    and author_id = auth.uid()
    and board_id not in ('feed', 'notice')
    and (
      is_work_admin()
      or (select is_public from work_boards where id = board_id) = true
      or exists (
        select 1 from work_board_permissions
        where profile_id = auth.uid() and board_id = work_reports.board_id
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
      or is_work_admin()
      or is_work_board_leader(board_id)
    )
  )
  with check (
    is_work_approved()
    and (
      author_id = auth.uid()
      or is_work_admin()
      or is_work_board_leader(board_id)
    )
  );
