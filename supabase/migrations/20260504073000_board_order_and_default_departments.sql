alter table work_boards
  add column if not exists display_order integer not null default 1000;

insert into work_boards (id, name, description, icon, is_public, display_order) values
  ('notice', '공지사항', '전사 공지', 'Bell', true, 1),
  ('content', '컨텐츠팀', '컨텐츠팀 게시판', 'Dot', false, 2),
  ('sales', '영업팀', '영업팀 게시판', 'Dot', false, 3),
  ('production', '생산팀', '생산팀 게시판', 'Dot', false, 4),
  ('logistics', '물류팀', '물류팀 게시판', 'Dot', false, 5),
  ('new-business', '신사업팀', '신사업팀 게시판', 'Dot', false, 6),
  ('management', '경영관리실', '경영관리실 게시판', 'Dot', false, 7),
  ('ceo', '대표이사', '대표이사 게시판', 'Dot', false, 8)
on conflict (id) do update set
  name = excluded.name,
  icon = excluded.icon,
  display_order = excluded.display_order;

update work_boards
set display_order = 0
where id = 'feed';
