drop policy if exists "Admins can delete other profiles" on work_profiles;
create policy "Admins can delete other profiles"
  on work_profiles for delete
  using (is_work_admin() and id <> auth.uid());
