-- The full feed composer stores posts with board_id = 'feed'.
-- If the system board row was deleted from a live database, the FK from
-- work_posts.board_id to work_boards.id blocks every new feed post.
insert into public.work_boards (id, name, description, icon, is_public, display_order)
values ('feed', '전체 피드', '모든 팀원의 소식을 확인하세요', 'LayoutDashboard', true, 0)
on conflict (id) do update set
  name = coalesce(nullif(public.work_boards.name, ''), excluded.name),
  description = coalesce(nullif(public.work_boards.description, ''), excluded.description),
  icon = coalesce(nullif(public.work_boards.icon, ''), excluded.icon),
  is_public = true,
  display_order = 0;

insert into public.work_boards (id, name, description, icon, is_public, display_order)
values ('notice', '공지사항', '전사 공지', 'Bell', true, 1)
on conflict (id) do update set
  name = coalesce(nullif(public.work_boards.name, ''), excluded.name),
  description = coalesce(nullif(public.work_boards.description, ''), excluded.description),
  icon = coalesce(nullif(public.work_boards.icon, ''), excluded.icon),
  is_public = true;
