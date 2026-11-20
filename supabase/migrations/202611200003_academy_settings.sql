create table if not exists public.academy_settings (
  id text primary key check (id = 'academy'),
  organization_name text not null default 'St Dzikaz Academy'
    check (length(trim(organization_name)) between 1 and 100)
);

insert into public.academy_settings (id, organization_name)
values ('academy', 'St Dzikaz Academy')
on conflict (id) do nothing;

alter table public.academy_settings enable row level security;

grant select on public.academy_settings to anon, authenticated;
grant update (organization_name) on public.academy_settings to authenticated;

drop policy if exists "Anyone can read academy display settings" on public.academy_settings;
drop policy if exists "Admins can update academy display settings" on public.academy_settings;

create policy "Anyone can read academy display settings"
  on public.academy_settings for select to anon, authenticated
  using (id = 'academy');

create policy "Admins can update academy display settings"
  on public.academy_settings for update to authenticated
  using (
    id = 'academy'
    and (select public.current_academy_role()) = 'admin'
  )
  with check (
    id = 'academy'
    and length(trim(organization_name)) between 1 and 100
    and (select public.current_academy_role()) = 'admin'
  );
