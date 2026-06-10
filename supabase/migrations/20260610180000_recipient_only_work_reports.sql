drop policy if exists "Users can read accessible reports" on public.work_reports;
create policy "Users can read accessible reports"
  on public.work_reports for select
  using (
    is_work_approved()
    and (
      author_id = auth.uid()
      or recipient_id = auth.uid()
    )
  );

drop policy if exists "Users can update accessible reports" on public.work_reports;
create policy "Users can update accessible reports"
  on public.work_reports for update
  using (
    is_work_approved()
    and (
      (author_id = auth.uid() and review_status in ('draft', 'submitted', 'changes_requested'))
      or recipient_id = auth.uid()
    )
  )
  with check (
    is_work_approved()
    and (
      author_id = auth.uid()
      or recipient_id = auth.uid()
    )
  );
