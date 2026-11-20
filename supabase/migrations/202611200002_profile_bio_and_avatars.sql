alter table public.profiles
  add column if not exists bio text not null default '' check (char_length(bio) <= 300),
  add column if not exists avatar_url text not null default '' check (char_length(avatar_url) <= 2048);

grant update (bio, avatar_url) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-avatars',
  'profile-avatars',
  true,
  2000000,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Anyone can view profile avatars" on storage.objects;
drop policy if exists "Users can upload their own profile avatar" on storage.objects;
drop policy if exists "Users can replace their own profile avatar" on storage.objects;

create policy "Anyone can view profile avatars"
  on storage.objects for select to public
  using (bucket_id = 'profile-avatars');

create policy "Users can upload their own profile avatar"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users can replace their own profile avatar"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'profile-avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
