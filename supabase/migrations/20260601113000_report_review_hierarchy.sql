-- Enforce report review hierarchy:
-- team member -> board leader -> admin.
-- Board leaders cannot review reports written by another board leader.

create or replace function is_work_report_reviewer(p_board_id text, p_author_id uuid)
returns boolean language sql security definer as $$
  select auth.uid() is not null
    and auth.uid() <> p_author_id
    and (
      is_work_admin()
      or (
        is_work_board_leader(p_board_id)
        and not exists (
          select 1 from work_profiles author
          where author.id = p_author_id
            and author.role = 'admin'
        )
        and not exists (
          select 1 from work_board_permissions author_permission
          where author_permission.profile_id = p_author_id
            and author_permission.board_id = p_board_id
            and author_permission.board_role = 'leader'
        )
      )
    );
$$;

drop policy if exists "Users can read accessible reports" on work_reports;
create policy "Users can read accessible reports"
  on work_reports for select
  using (
    is_work_approved()
    and (
      author_id = auth.uid()
      or is_work_report_reviewer(board_id, author_id)
    )
  );

drop policy if exists "Users can update accessible reports" on work_reports;
create policy "Users can update accessible reports"
  on work_reports for update
  using (
    is_work_approved()
    and (
      (author_id = auth.uid() and review_status in ('draft', 'submitted', 'changes_requested'))
      or is_work_report_reviewer(board_id, author_id)
    )
  )
  with check (
    is_work_approved()
    and (
      author_id = auth.uid()
      or is_work_report_reviewer(board_id, author_id)
    )
  );
