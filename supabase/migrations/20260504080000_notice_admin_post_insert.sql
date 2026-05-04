drop policy if exists "Approved users can insert posts" on work_posts;
create policy "Approved users can insert posts"
  on work_posts for insert
  with check (
    is_work_approved()
    and author_id = auth.uid()
    and (board_id <> 'notice' or is_work_admin())
  );
