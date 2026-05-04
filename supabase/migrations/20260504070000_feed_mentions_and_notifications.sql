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
  v_link text := '/feed?post=' || p_post_id::text;
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

  if not exists (
    select 1
    from public.work_posts
    where id = p_post_id
      and board_id = 'feed'
  ) then
    return 0;
  end if;

  insert into public.work_notifications (profile_id, type, title, body, link)
  select
    mentioned.id,
    'mention',
    '새 멘션',
    v_actor_name || '님이 피드에서 회원님을 언급했습니다.',
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
