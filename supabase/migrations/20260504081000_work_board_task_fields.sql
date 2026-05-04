alter table work_posts
  add column if not exists work_status text
    check (work_status is null or work_status in ('in_progress', 'completed', 'on_hold')),
  add column if not exists assignee_id uuid references work_profiles(id) on delete set null;

update work_posts
set work_status = 'in_progress',
    is_pinned = true
where board_id not in ('feed', 'notice')
  and work_status is null;

drop policy if exists "Authors can update own posts" on work_posts;
create policy "Authors can update own posts"
  on work_posts for update
  using (author_id = auth.uid() or assignee_id = auth.uid() or is_work_admin());
