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
  is_public = true,
  display_order = 1;

with ordered_boards as (
  select
    id,
    row_number() over (order by display_order, created_at, id) + 1 as next_display_order
  from public.work_boards
  where id not in ('feed', 'notice')
)
update public.work_boards board
set display_order = ordered_boards.next_display_order
from ordered_boards
where board.id = ordered_boards.id;
