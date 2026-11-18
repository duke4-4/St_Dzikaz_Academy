alter table public.subjects
  add column if not exists archived_at timestamptz;

create table if not exists public.classroom_documents (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  uploaded_by uuid not null references public.profiles (id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null check (
    mime_type in (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  created_at timestamptz not null default now()
);

create table if not exists public.classroom_assignments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  created_by uuid not null references public.profiles (id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  instructions text not null default '',
  max_score numeric(7, 2) not null default 100 check (max_score > 0),
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.classroom_submissions (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.classroom_assignments (id) on delete restrict,
  learner_id uuid not null references public.profiles (id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null check (
    mime_type in (
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  ),
  size_bytes integer not null check (size_bytes between 1 and 10485760),
  submitted_at timestamptz not null default now(),
  unique (assignment_id, learner_id)
);

create table if not exists public.classroom_attendance (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete restrict,
  learner_id uuid not null references public.profiles (id) on delete cascade,
  attendance_date date not null,
  status text not null check (status in ('present', 'absent', 'late', 'excused')),
  recorded_by uuid not null references public.profiles (id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (subject_id, learner_id, attendance_date)
);

alter table public.marks
  add column if not exists assignment_id uuid;

do $$ begin
  alter table public.marks
    add constraint marks_assignment_id_fkey
    foreign key (assignment_id) references public.classroom_assignments (id) on delete restrict;
exception when duplicate_object then null;
end $$;

create unique index if not exists marks_assignment_learner_unique_idx
  on public.marks (assignment_id, learner_id)
  where assignment_id is not null;
create index if not exists classroom_documents_subject_idx
  on public.classroom_documents (subject_id, created_at desc);
create index if not exists classroom_assignments_subject_idx
  on public.classroom_assignments (subject_id, created_at desc);
create index if not exists classroom_submissions_assignment_idx
  on public.classroom_submissions (assignment_id, submitted_at desc);
create index if not exists classroom_attendance_subject_date_idx
  on public.classroom_attendance (subject_id, attendance_date desc);

create or replace function public.can_manage_subject(requested_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.subjects s
    where s.id = requested_subject_id
      and (
        s.instructor_id = (select auth.uid())
        or (select public.current_academy_role()) = 'admin'
      )
  )
$$;

create or replace function public.is_enrolled_in_subject(requested_subject_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.enrollments e
    where e.subject_id = requested_subject_id
      and e.learner_id = (select auth.uid())
  )
$$;

create or replace function public.lookup_learner_for_enrollment(requested_registration_number text)
returns table (id uuid, full_name text, registration_number text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, sd.registration_number
  from public.student_details sd
  join public.profiles p on p.id = sd.profile_id
  where lower(trim(sd.registration_number)) = lower(trim(requested_registration_number))
    and p.role = 'learner'
    and (select public.current_academy_role()) in ('instructor', 'admin')
  limit 1
$$;

revoke all on function public.can_manage_subject(uuid) from public, anon;
revoke all on function public.is_enrolled_in_subject(uuid) from public, anon;
revoke all on function public.lookup_learner_for_enrollment(text) from public, anon;
grant execute on function public.can_manage_subject(uuid) to authenticated;
grant execute on function public.is_enrolled_in_subject(uuid) to authenticated;
grant execute on function public.lookup_learner_for_enrollment(text) to authenticated;

alter table public.classroom_documents enable row level security;
alter table public.classroom_assignments enable row level security;
alter table public.classroom_submissions enable row level security;
alter table public.classroom_attendance enable row level security;

grant select, insert, update, delete on public.classroom_documents to authenticated;
grant select, insert, update on public.classroom_assignments to authenticated;
grant select, insert on public.classroom_submissions to authenticated;
grant update (file_name, storage_path, mime_type, size_bytes, submitted_at)
  on public.classroom_submissions to authenticated;
grant select, insert, update on public.classroom_attendance to authenticated;
grant insert, update on public.marks to authenticated;

drop policy if exists "Classroom members can read documents" on public.classroom_documents;
drop policy if exists "Teachers can add classroom documents" on public.classroom_documents;
drop policy if exists "Teachers can update classroom documents" on public.classroom_documents;
drop policy if exists "Teachers can remove classroom documents" on public.classroom_documents;
drop policy if exists "Classroom members can read assignments" on public.classroom_assignments;
drop policy if exists "Teachers can create assignments" on public.classroom_assignments;
drop policy if exists "Teachers can update assignments" on public.classroom_assignments;
drop policy if exists "Classroom members can read submissions" on public.classroom_submissions;
drop policy if exists "Enrolled learners can submit work" on public.classroom_submissions;
drop policy if exists "Learners can replace their submissions" on public.classroom_submissions;
drop policy if exists "Classroom members can read attendance" on public.classroom_attendance;
drop policy if exists "Teachers can record attendance" on public.classroom_attendance;
drop policy if exists "Teachers can update attendance" on public.classroom_attendance;
drop policy if exists "Subject instructors and admins can record marks" on public.marks;

create policy "Classroom members can read documents"
  on public.classroom_documents for select to authenticated
  using (
    public.can_manage_subject(subject_id)
    or public.is_enrolled_in_subject(subject_id)
  );
create policy "Teachers can add classroom documents"
  on public.classroom_documents for insert to authenticated
  with check (
    uploaded_by = (select auth.uid())
    and public.can_manage_subject(subject_id)
    and storage_path like 'subjects/' || subject_id::text || '/materials/%'
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.archived_at is null
    )
  );
create policy "Teachers can update classroom documents"
  on public.classroom_documents for update to authenticated
  using (public.can_manage_subject(subject_id))
  with check (
    public.can_manage_subject(subject_id)
    and storage_path like 'subjects/' || subject_id::text || '/materials/%'
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.archived_at is null
    )
  );
create policy "Teachers can remove classroom documents"
  on public.classroom_documents for delete to authenticated
  using (public.can_manage_subject(subject_id));

create policy "Classroom members can read assignments"
  on public.classroom_assignments for select to authenticated
  using (
    public.can_manage_subject(subject_id)
    or public.is_enrolled_in_subject(subject_id)
  );
create policy "Teachers can create assignments"
  on public.classroom_assignments for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and public.can_manage_subject(subject_id)
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.archived_at is null
    )
  );
create policy "Teachers can update assignments"
  on public.classroom_assignments for update to authenticated
  using (public.can_manage_subject(subject_id))
  with check (
    public.can_manage_subject(subject_id)
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.archived_at is null
    )
  );

create policy "Classroom members can read submissions"
  on public.classroom_submissions for select to authenticated
  using (
    learner_id = (select auth.uid())
    or exists (
      select 1
      from public.classroom_assignments a
      where a.id = assignment_id
        and public.can_manage_subject(a.subject_id)
    )
  );
create policy "Enrolled learners can submit work"
  on public.classroom_submissions for insert to authenticated
  with check (
    learner_id = (select auth.uid())
    and storage_path like (
      select 'subjects/' || a.subject_id::text || '/submissions/' || a.id::text || '/' || learner_id::text || '/%'
      from public.classroom_assignments a
      where a.id = assignment_id
    )
    and exists (
      select 1
      from public.classroom_assignments a
      join public.subjects s on s.id = a.subject_id
      where a.id = assignment_id
        and s.archived_at is null
        and public.is_enrolled_in_subject(a.subject_id)
    )
  );
create policy "Learners can replace their submissions"
  on public.classroom_submissions for update to authenticated
  using (
    learner_id = (select auth.uid())
    and storage_path like (
      select 'subjects/' || a.subject_id::text || '/submissions/' || a.id::text || '/' || learner_id::text || '/%'
      from public.classroom_assignments a
      where a.id = assignment_id
    )
    and exists (
      select 1
      from public.classroom_assignments a
      join public.subjects s on s.id = a.subject_id
      where a.id = assignment_id and s.archived_at is null
    )
  )
  with check (
    learner_id = (select auth.uid())
    and storage_path like (
      select 'subjects/' || a.subject_id::text || '/submissions/' || a.id::text || '/' || learner_id::text || '/%'
      from public.classroom_assignments a
      where a.id = assignment_id
    )
    and exists (
      select 1
      from public.classroom_assignments a
      join public.subjects s on s.id = a.subject_id
      where a.id = assignment_id
        and s.archived_at is null
        and public.is_enrolled_in_subject(a.subject_id)
    )
  );

create policy "Classroom members can read attendance"
  on public.classroom_attendance for select to authenticated
  using (
    learner_id = (select auth.uid())
    or public.can_manage_subject(subject_id)
  );
create policy "Teachers can record attendance"
  on public.classroom_attendance for insert to authenticated
  with check (
    recorded_by = (select auth.uid())
    and public.can_manage_subject(subject_id)
    and exists (
      select 1 from public.enrollments e
      where e.subject_id = classroom_attendance.subject_id
        and e.learner_id = classroom_attendance.learner_id
    )
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.archived_at is null
    )
  );
create policy "Teachers can update attendance"
  on public.classroom_attendance for update to authenticated
  using (public.can_manage_subject(subject_id))
  with check (
    recorded_by = (select auth.uid())
    and public.can_manage_subject(subject_id)
    and exists (
      select 1 from public.enrollments e
      where e.subject_id = classroom_attendance.subject_id
        and e.learner_id = classroom_attendance.learner_id
    )
    and exists (
      select 1 from public.subjects s
      where s.id = subject_id and s.archived_at is null
    )
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
          select 1
          from public.subjects s
          join public.enrollments e on e.subject_id = s.id
          where s.id = marks.subject_id
            and s.instructor_id = (select auth.uid())
            and e.learner_id = marks.learner_id
        )
      )
    )
    and (
      assignment_id is null
      or exists (
        select 1
        from public.classroom_assignments a
        join public.enrollments e on e.subject_id = a.subject_id
        where a.id = marks.assignment_id
          and a.subject_id = marks.subject_id
          and e.learner_id = marks.learner_id
      )
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'classroom-files',
  'classroom-files',
  false,
  10485760,
  array[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Classroom members can download materials" on storage.objects;
drop policy if exists "Teachers can upload materials" on storage.objects;
drop policy if exists "Teachers can delete unlinked materials" on storage.objects;
drop policy if exists "Classroom members can download submissions" on storage.objects;
drop policy if exists "Enrolled learners can upload submissions" on storage.objects;
drop policy if exists "Learners can delete unlinked submissions" on storage.objects;

create policy "Classroom members can download materials"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'classroom-files'
    and (storage.foldername(name))[1] = 'subjects'
    and (storage.foldername(name))[3] = 'materials'
    and exists (
      select 1
      from public.subjects s
      where s.id::text = (storage.foldername(name))[2]
        and (
          public.can_manage_subject(s.id)
          or public.is_enrolled_in_subject(s.id)
        )
    )
  );
create policy "Teachers can upload materials"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'classroom-files'
    and (storage.foldername(name))[1] = 'subjects'
    and (storage.foldername(name))[3] = 'materials'
    and exists (
      select 1
      from public.subjects s
      where s.id::text = (storage.foldername(name))[2]
        and s.archived_at is null
        and public.can_manage_subject(s.id)
    )
  );
create policy "Teachers can delete unlinked materials"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'classroom-files'
    and (storage.foldername(name))[1] = 'subjects'
    and (storage.foldername(name))[3] = 'materials'
    and public.can_manage_subject(
      (select s.id from public.subjects s where s.id::text = (storage.foldername(name))[2])
    )
  );
create policy "Classroom members can download submissions"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'classroom-files'
    and (storage.foldername(name))[1] = 'subjects'
    and (storage.foldername(name))[3] = 'submissions'
    and exists (
      select 1
      from public.classroom_assignments a
      join public.subjects s on s.id = a.subject_id
      where s.id::text = (storage.foldername(name))[2]
        and a.id::text = (storage.foldername(name))[4]
        and (
          public.can_manage_subject(s.id)
          or (
            (storage.foldername(name))[5] = (select auth.uid())::text
            and public.is_enrolled_in_subject(s.id)
          )
        )
    )
  );
create policy "Enrolled learners can upload submissions"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'classroom-files'
    and (storage.foldername(name))[1] = 'subjects'
    and (storage.foldername(name))[3] = 'submissions'
    and (storage.foldername(name))[5] = (select auth.uid())::text
    and exists (
      select 1
      from public.classroom_assignments a
      join public.subjects s on s.id = a.subject_id
      where s.id::text = (storage.foldername(name))[2]
        and a.id::text = (storage.foldername(name))[4]
        and s.archived_at is null
        and public.is_enrolled_in_subject(s.id)
    )
  );
create policy "Learners can delete unlinked submissions"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'classroom-files'
    and (storage.foldername(name))[3] = 'submissions'
    and (storage.foldername(name))[5] = (select auth.uid())::text
    and not exists (
      select 1 from public.classroom_submissions cs
      where cs.storage_path = storage.objects.name
    )
  );
