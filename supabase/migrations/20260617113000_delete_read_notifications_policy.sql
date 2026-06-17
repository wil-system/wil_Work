drop policy if exists "Users can delete own read notifications" on public.work_notifications;
create policy "Users can delete own read notifications"
  on public.work_notifications for delete
  using (profile_id = auth.uid() and is_read = true);
