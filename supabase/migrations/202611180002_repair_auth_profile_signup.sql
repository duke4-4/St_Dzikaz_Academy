create or replace function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  requested_role public.academy_role;
  generated_username text := 'user_' || substr(replace(new.id::text, '-', ''), 1, 25);
begin
  if requested_username is null
    or requested_username !~ '^[A-Za-z0-9_]{3,30}$'
    or exists (
      select 1
      from public.profiles p
      where p.username = requested_username
        and p.id <> new.id
    )
  then
    requested_username := generated_username;
  end if;

  if exists (
    select 1
    from public.profiles p
    where p.username = requested_username
      and p.id <> new.id
  ) then
    raise exception 'Could not generate a unique academy username for the new account';
  end if;

  requested_role := case
    when new.raw_app_meta_data ->> 'role' in ('learner', 'instructor', 'admin')
      then (new.raw_app_meta_data ->> 'role')::public.academy_role
    else 'learner'::public.academy_role
  end;

  insert into public.profiles (id, username, full_name, role, requires_password_change)
  values (
    new.id,
    requested_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), requested_username),
    requested_role,
    coalesce((new.raw_user_meta_data ->> 'requires_password_change') = 'true', false)
  );

  if requested_role = 'learner' then
    insert into public.student_details (profile_id)
    values (new.id)
    on conflict (profile_id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();
