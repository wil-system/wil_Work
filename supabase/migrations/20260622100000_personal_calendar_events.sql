alter table public.work_calendar_events
  alter column created_by set default auth.uid();

drop policy if exists "Approved users can read all events" on public.work_calendar_events;
drop policy if exists "Users can read own events" on public.work_calendar_events;
create policy "Users can read own events"
  on public.work_calendar_events for select
  to authenticated
  using (is_work_approved() and created_by = auth.uid());

drop policy if exists "Approved users can insert events" on public.work_calendar_events;
drop policy if exists "Users can insert own events" on public.work_calendar_events;
create policy "Users can insert own events"
  on public.work_calendar_events for insert
  to authenticated
  with check (is_work_approved() and created_by = auth.uid());

drop policy if exists "Creator or admin can update events" on public.work_calendar_events;
drop policy if exists "Users can update own events" on public.work_calendar_events;
create policy "Users can update own events"
  on public.work_calendar_events for update
  to authenticated
  using (is_work_approved() and created_by = auth.uid())
  with check (is_work_approved() and created_by = auth.uid());
