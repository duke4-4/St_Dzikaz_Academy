-- Track first-login onboarding without re-prompting accounts that have already signed in.
do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'onboarding_completed_at'
  ) then
    alter table public.profiles
      add column onboarding_completed_at timestamptz not null default now();
    alter table public.profiles
      alter column onboarding_completed_at drop default;
    alter table public.profiles
      alter column onboarding_completed_at drop not null;
  end if;
end;
$$;

grant update (onboarding_completed_at) on public.profiles to authenticated;

notify pgrst, 'reload schema';
