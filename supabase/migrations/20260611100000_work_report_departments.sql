-- Store the selected work report department independently from board_id.

alter table public.work_reports
  add column if not exists department text not null default '';

update public.work_reports report
set department = board.name
from public.work_boards board
where report.board_id = board.id
  and nullif(report.department, '') is null;

update public.work_reports report
set department = profile.department
from public.work_profiles profile
where report.author_id = profile.id
  and nullif(report.department, '') is null
  and nullif(profile.department, '') is not null;

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
    coalesce(nullif(report.department, ''), board.name, '부서 미지정'),
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
  elsif p_event in ('reviewed', 'changes_requested') then
    insert into public.work_notifications (profile_id, type, title, body, link)
    select v_author_id, 'report',
      case when p_event = 'reviewed' then '업무보고 검토완료' else '업무보고 수정요청' end,
      case
        when p_event = 'reviewed' then v_board_name || ' ' || v_period_label || ' 업무보고가 검토완료되었습니다.'
        else v_board_name || ' ' || v_period_label || ' 업무보고에 수정요청이 도착했습니다.'
      end,
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
