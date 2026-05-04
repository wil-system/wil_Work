create or replace function public.prevent_assignee_post_content_update()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if is_work_admin() or old.author_id = auth.uid() then
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
