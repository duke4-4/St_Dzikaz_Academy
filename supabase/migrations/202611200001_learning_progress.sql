create table if not exists public.learning_progress (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  course_key text not null check (length(trim(course_key)) between 1 and 120),
  completed_lessons integer not null default 0 check (completed_lessons between 0 and 9),
  updated_at timestamptz not null default now(),
  primary key (profile_id, course_key)
);

alter table public.learning_progress enable row level security;

grant select, insert, update on public.learning_progress to authenticated;

drop policy if exists "Learners manage their own lesson progress" on public.learning_progress;
create policy "Learners manage their own lesson progress"
  on public.learning_progress for all to authenticated
  using (
    profile_id = (select auth.uid())
    and (select public.current_academy_role()) = 'learner'
  )
  with check (
    profile_id = (select auth.uid())
    and (select public.current_academy_role()) = 'learner'
  );

create or replace function public.update_learning_progress_timestamp()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists learning_progress_set_updated_at on public.learning_progress;
create trigger learning_progress_set_updated_at
  before update on public.learning_progress
  for each row execute function public.update_learning_progress_timestamp();
