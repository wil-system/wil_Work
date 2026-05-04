alter table work_board_permissions
  add column if not exists board_role text not null default 'member'
  check (board_role in ('leader', 'member'));

update work_board_permissions
set board_role = 'member'
where board_role is null;
