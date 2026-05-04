drop policy if exists "Admins can delete boards" on work_boards;
create policy "Admins can delete boards"
  on work_boards for delete
  using (is_work_admin() and id not in ('feed', 'notice'));
