drop policy if exists "Users can delete own events" on public.work_calendar_events;

create policy "Users can delete own events"
  on public.work_calendar_events for delete
  to authenticated
  using (is_work_approved() and created_by = auth.uid());
