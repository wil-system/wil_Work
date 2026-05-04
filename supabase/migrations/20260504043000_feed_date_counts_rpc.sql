create or replace function get_feed_post_counts_by_day()
returns table(date date, count bigint)
language sql
security definer
as $$
  select (created_at at time zone 'Asia/Seoul')::date as date, count(*) as count
  from work_posts
  where board_id = 'feed'
  group by 1
  order by 1;
$$;
