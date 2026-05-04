create or replace function public.handle_new_work_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  insert into public.work_profiles (
    id,
    name,
    email,
    department,
    position,
    avatar_initial,
    avatar_color
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'position', ''),
    coalesce(
      new.raw_user_meta_data->>'avatar_initial',
      upper(substr(coalesce(new.raw_user_meta_data->>'name', new.email), 1, 1))
    ),
    coalesce(new.raw_user_meta_data->>'avatar_color', '#1e1b4b')
  );

  return new;
end;
$$;
