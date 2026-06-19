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
  )
  with check (
    author_id = auth.uid()
    or (
      board_id <> 'feed'
      and work_status is not null
      and assignee_id = auth.uid()
    )
  );
