create extension if not exists pgcrypto;

create type public.academy_role as enum ('learner', 'instructor', 'admin');
create type public.subject_level as enum ('O Level', 'A Level');
create type public.notice_audience as enum ('everyone', 'learner', 'instructor', 'admin');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[A-Za-z0-9_]{3,30}$'),
  full_name text not null default '',
  role public.academy_role not null default 'learner',
  school text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  level public.subject_level not null,
  instructor_id uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (name, level)
);

create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  learner_id uuid not null references public.profiles (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (subject_id, learner_id)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '',
  location text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  audience public.notice_audience not null default 'everyone',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 160),
  body text not null check (length(trim(body)) > 0),
  audience public.notice_audience not null default 'everyone',
  created_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.marks (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  recorded_by uuid not null references public.profiles (id) on delete restrict,
  assessment_name text not null check (length(trim(assessment_name)) between 1 and 160),
  score numeric(7, 2) not null check (score >= 0),
  max_score numeric(7, 2) not null check (max_score > 0 and score <= max_score),
  assessed_on date not null default current_date,
  feedback text not null default '',
  created_at timestamptz not null default now()
);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  learner_id uuid not null references public.profiles (id) on delete cascade,
  instructor_id uuid not null references public.profiles (id) on delete cascade,
  subject_id uuid not null references public.subjects (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (learner_id, instructor_id, subject_id),
  check (learner_id <> instructor_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 5000),
  sent_at timestamptz not null default now(),
  read_at timestamptz
);

create index subjects_instructor_id_idx on public.subjects (instructor_id);
create index enrollments_learner_id_idx on public.enrollments (learner_id);
create index events_starts_at_idx on public.events (starts_at);
create index notices_created_at_idx on public.notices (created_at desc);
create index marks_learner_subject_idx on public.marks (learner_id, subject_id, assessed_on desc);
create index conversations_participants_idx on public.conversations (learner_id, instructor_id);
create index messages_conversation_sent_at_idx on public.messages (conversation_id, sent_at);

create function public.current_academy_role()
returns public.academy_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function public.create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text := new.raw_user_meta_data ->> 'username';
begin
  if requested_username is null then
    requested_username := 'user_' || replace(substr(new.id::text, 1, 12), '-', '');
  elsif requested_username !~ '^[A-Za-z0-9_]{3,30}$' then
    raise exception 'Username must be 3 to 30 letters, numbers, or underscores';
  end if;

  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    requested_username,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), requested_username)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_profile_for_new_user();

alter table public.profiles enable row level security;
alter table public.subjects enable row level security;
alter table public.enrollments enable row level security;
alter table public.events enable row level security;
alter table public.notices enable row level security;
alter table public.marks enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

grant select on public.profiles to authenticated;
grant update (username, full_name, school, phone) on public.profiles to authenticated;
grant select, insert, update, delete on public.subjects to authenticated;
grant select, insert, delete on public.enrollments to authenticated;
grant select, insert, update, delete on public.events to authenticated;
grant select, insert, update, delete on public.notices to authenticated;
grant select, insert, update, delete on public.marks to authenticated;
grant select, insert, delete on public.conversations to authenticated;
grant select, insert on public.messages to authenticated;
grant update (read_at) on public.messages to authenticated;

create policy "Users can read permitted profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
    or exists (
      select 1
      from public.enrollments e
      join public.subjects s on s.id = e.subject_id
      where
        (e.learner_id = (select auth.uid()) and s.instructor_id = profiles.id)
        or (e.learner_id = profiles.id and s.instructor_id = (select auth.uid()))
    )
  );

create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (
    id = (select auth.uid())
    and role = (select public.current_academy_role())
  );

create policy "Authenticated users can read subjects"
  on public.subjects for select to authenticated using (true);
create policy "Instructors and admins can create subjects"
  on public.subjects for insert to authenticated
  with check (
    instructor_id = (select auth.uid())
    and (select public.current_academy_role()) in ('instructor', 'admin')
  );
create policy "Subject owners and admins can update subjects"
  on public.subjects for update to authenticated
  using (
    instructor_id = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  )
  with check (
    instructor_id = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Subject owners and admins can delete subjects"
  on public.subjects for delete to authenticated
  using (
    instructor_id = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );

create policy "Learners and subject instructors can read enrollments"
  on public.enrollments for select to authenticated
  using (
    learner_id = (select auth.uid())
    or exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.instructor_id = (select auth.uid())
    )
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Instructors and admins can enroll learners"
  on public.enrollments for insert to authenticated
  with check (
    (select public.current_academy_role()) = 'admin'
    or (
      exists (
        select 1 from public.subjects s
        where s.id = subject_id and s.instructor_id = (select auth.uid())
      )
      and (select public.current_academy_role()) = 'instructor'
    )
  );
create policy "Instructors and admins can remove enrollments"
  on public.enrollments for delete to authenticated
  using (
    (select public.current_academy_role()) = 'admin'
    or exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.instructor_id = (select auth.uid())
    )
  );

create policy "Users can read events for their audience"
  on public.events for select to authenticated
  using (
    audience = 'everyone'
    or audience::text = (select public.current_academy_role())::text
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Instructors and admins can create events"
  on public.events for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.current_academy_role()) in ('instructor', 'admin')
  );
create policy "Event authors and admins can update events"
  on public.events for update to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  )
  with check (
    created_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Event authors and admins can delete events"
  on public.events for delete to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );

create policy "Users can read notices for their audience"
  on public.notices for select to authenticated
  using (
    audience = 'everyone'
    or audience::text = (select public.current_academy_role())::text
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Instructors and admins can create notices"
  on public.notices for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.current_academy_role()) in ('instructor', 'admin')
  );
create policy "Notice authors and admins can update notices"
  on public.notices for update to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  )
  with check (
    created_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Notice authors and admins can delete notices"
  on public.notices for delete to authenticated
  using (
    created_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );

create policy "Learners, subject instructors, and admins can read marks"
  on public.marks for select to authenticated
  using (
    learner_id = (select auth.uid())
    or recorded_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Subject instructors and admins can record marks"
  on public.marks for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and (
      (select public.current_academy_role()) = 'admin'
      or (
        (select public.current_academy_role()) = 'instructor'
        and exists (
          select 1 from public.subjects s
          join public.enrollments e on e.subject_id = s.id
          where s.id = subject_id
            and s.instructor_id = (select auth.uid())
            and e.learner_id = marks.learner_id
        )
      )
    )
  );
create policy "Mark authors and admins can update marks"
  on public.marks for update to authenticated
  using (
    recorded_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  )
  with check (
    (select public.current_academy_role()) = 'admin'
    or (
      recorded_by = (select auth.uid())
      and (select public.current_academy_role()) = 'instructor'
      and exists (
        select 1 from public.subjects s
        join public.enrollments e on e.subject_id = s.id
        where s.id = marks.subject_id
          and s.instructor_id = (select auth.uid())
          and e.learner_id = marks.learner_id
      )
    )
  );
create policy "Mark authors and admins can delete marks"
  on public.marks for delete to authenticated
  using (
    recorded_by = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );

create policy "Conversation participants can read conversations"
  on public.conversations for select to authenticated
  using (
    learner_id = (select auth.uid())
    or instructor_id = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Enrolled learners and their instructors can start conversations"
  on public.conversations for insert to authenticated
  with check (
    exists (
      select 1
      from public.subjects s
      join public.enrollments e on e.subject_id = s.id
      where s.id = subject_id
        and e.learner_id = learner_id
        and s.instructor_id = instructor_id
        and (select auth.uid()) in (learner_id, instructor_id)
    )
  );
create policy "Conversation participants and admins can delete conversations"
  on public.conversations for delete to authenticated
  using (
    learner_id = (select auth.uid())
    or instructor_id = (select auth.uid())
    or (select public.current_academy_role()) = 'admin'
  );

create policy "Conversation participants can read messages"
  on public.messages for select to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.learner_id, c.instructor_id)
    )
    or (select public.current_academy_role()) = 'admin'
  );
create policy "Conversation participants can send messages as themselves"
  on public.messages for insert to authenticated
  with check (
    sender_id = (select auth.uid())
    and exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.learner_id, c.instructor_id)
    )
  );
create policy "Recipients can mark messages as read"
  on public.messages for update to authenticated
  using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.learner_id, c.instructor_id)
        and sender_id <> (select auth.uid())
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id
        and (select auth.uid()) in (c.learner_id, c.instructor_id)
        and sender_id <> (select auth.uid())
    )
  );
