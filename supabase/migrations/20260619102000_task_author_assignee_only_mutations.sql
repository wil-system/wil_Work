drop policy if exists "Authors can update own posts" on public.work_posts;
create policy "Authors can update own posts"
  on public.work_posts for update
  using (
    author_id = auth.uid()
    or (
      board_id <> 'feed'
      and work_status is not null
      and assignee_id = auth.uid()
    )
    or (
      board_id <> 'feed'
      and work_status is null
      and is_work_admin()
    )
  )
  with check (
    author_id = auth.uid()
    or (
      board_id <> 'feed'
      and work_status is not null
      and assignee_id = auth.uid()
    )
    or (
      board_id <> 'feed'
      and work_status is null
      and is_work_admin()
    )
  );

drop policy if exists "Authors can delete own posts" on public.work_posts;
create policy "Authors can delete own posts"
  on public.work_posts for delete
  using (
    author_id = auth.uid()
    or (
      board_id <> 'feed'
      and work_status is null
      and is_work_admin()
    )
  );
