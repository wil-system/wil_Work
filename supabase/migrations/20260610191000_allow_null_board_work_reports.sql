alter table public.work_reports
  alter column board_id drop default,
  alter column board_id drop not null;

update public.work_reports
set board_id = null
where board_id = 'feed';

drop policy if exists "Users can insert own reports" on public.work_reports;
create policy "Users can insert own reports"
  on public.work_reports for insert
  with check (
    is_work_approved()
    and author_id = auth.uid()
    and (
      board_id is null
      or (
        board_id <> 'notice'
        and (
          is_work_admin()
          or (select is_public from public.work_boards where id = board_id) = true
          or exists (
            select 1 from public.work_board_permissions
            where profile_id = auth.uid() and board_id = work_reports.board_id
          )
        )
      )
    )
    and (
      recipient_id is null
      or exists (
        select 1 from public.work_profiles recipient
        where recipient.id = work_reports.recipient_id
          and recipient.status = 'approved'
          and recipient.id <> auth.uid()
      )
    )
  );

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
