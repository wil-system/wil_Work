drop policy if exists "Authors can delete own posts" on work_posts;
create policy "Authors can delete own posts"
  on work_posts for delete
  using (author_id = auth.uid() or is_work_admin());

drop policy if exists "Authors can update own comments" on work_comments;
create policy "Authors can update own comments"
  on work_comments for update
  using (author_id = auth.uid() or is_work_admin())
  with check (author_id = auth.uid() or is_work_admin());

drop policy if exists "Authors can delete own comments" on work_comments;
create policy "Authors can delete own comments"
  on work_comments for delete
  using (author_id = auth.uid() or is_work_admin());
