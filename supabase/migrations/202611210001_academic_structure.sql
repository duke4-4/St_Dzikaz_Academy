-- Adds class based academic structure while preserving legacy subjects and enrollments.
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) between 1 and 100),
  grade text not null default '',
  description text not null default '',
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (name, academic_year_id),
  unique (id, academic_year_id)
);

create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid not null,
  academic_year_id uuid not null,
  created_at timestamptz not null default now(),
  constraint teacher_assignments_class_year_fkey
    foreign key (class_id, academic_year_id) references public.classes(id, academic_year_id) on delete restrict,
  unique (teacher_id, subject_id, class_id)
);

create table if not exists public.student_class_enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete restrict,
  class_id uuid not null,
  academic_year_id uuid not null,
  created_at timestamptz not null default now(),
  constraint student_class_enrollments_class_year_fkey
    foreign key (class_id, academic_year_id) references public.classes(id, academic_year_id) on delete restrict,
  unique (student_id, class_id)
);

create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  teacher_id uuid not null references public.profiles(id) on delete restrict,
  title text not null check (length(trim(title)) between 1 and 160),
  description text not null default '',
  content text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subjects alter column instructor_id drop not null;
alter table public.subjects add column if not exists description text not null default '';
alter table public.classroom_documents add column if not exists class_id uuid references public.classes(id) on delete restrict;
alter table public.classroom_assignments add column if not exists class_id uuid references public.classes(id) on delete restrict;
alter table public.classroom_attendance add column if not exists class_id uuid references public.classes(id) on delete restrict;

create index if not exists classes_academic_year_idx on public.classes(academic_year_id, name);
create index if not exists teacher_assignments_teacher_class_idx on public.teacher_assignments(teacher_id, class_id);
create index if not exists teacher_assignments_subject_class_idx on public.teacher_assignments(subject_id, class_id);
create index if not exists student_class_enrollments_class_idx on public.student_class_enrollments(class_id, student_id);
create index if not exists lessons_class_subject_created_idx on public.lessons(class_id, subject_id, created_at desc);
create index if not exists classroom_documents_class_subject_idx on public.classroom_documents(class_id, subject_id, created_at desc);
create index if not exists classroom_assignments_class_subject_idx on public.classroom_assignments(class_id, subject_id, created_at desc);

-- Legacy class labels and years are copied only when both values are present.
insert into public.academic_years(name)
select distinct trim(sd.academic_year)
from public.student_details sd
where length(trim(coalesce(sd.academic_year, ''))) > 0
on conflict (name) do nothing;

insert into public.academic_years(name)
select distinct 'Unspecified'
from public.student_details sd
where length(trim(coalesce(sd.class_name, ''))) > 0
  and length(trim(coalesce(sd.academic_year, ''))) = 0
on conflict (name) do nothing;

insert into public.classes(name, grade, academic_year_id)
select distinct trim(sd.class_name), trim(sd.class_name), ay.id
from public.student_details sd
join public.academic_years ay
  on ay.name = coalesce(nullif(trim(sd.academic_year), ''), 'Unspecified')
where length(trim(coalesce(sd.class_name, ''))) > 0
on conflict (name, academic_year_id) do nothing;

-- Preserve each old per-subject enrollee as a class enrollee using exact class/year matches.
insert into public.student_class_enrollments(student_id, class_id, academic_year_id)
select distinct e.learner_id, c.id, c.academic_year_id
from public.enrollments e
join public.student_details sd on sd.profile_id = e.learner_id
join public.classes c
  on c.name = trim(sd.class_name)
join public.academic_years ay on ay.id = c.academic_year_id
  and ay.name = coalesce(nullif(trim(sd.academic_year), ''), 'Unspecified')
where length(trim(coalesce(sd.class_name, ''))) > 0
on conflict (student_id, class_id) do nothing;

-- Carry the prior single subject owner forward for each class where that subject was enrolled.
insert into public.teacher_assignments(teacher_id, subject_id, class_id, academic_year_id)
select distinct s.instructor_id, e.subject_id, c.id, c.academic_year_id
from public.enrollments e
join public.subjects s on s.id = e.subject_id
join public.student_details sd on sd.profile_id = e.learner_id
join public.classes c on c.name = trim(sd.class_name)
join public.academic_years ay on ay.id = c.academic_year_id
  and ay.name = coalesce(nullif(trim(sd.academic_year), ''), 'Unspecified')
where s.instructor_id is not null
  and length(trim(coalesce(sd.class_name, ''))) > 0
on conflict (teacher_id, subject_id, class_id) do nothing;

-- Keep unmatched legacy rows visible for administrators to reconcile later.
create table if not exists public.academic_migration_issues (
  id uuid primary key default gen_random_uuid(),
  source_table text not null check (source_table in ('enrollments', 'subjects')),
  source_id uuid not null,
  reason text not null,
  recorded_at timestamptz not null default now(),
  unique (source_table, source_id)
);

insert into public.academic_migration_issues(source_table, source_id, reason)
select 'enrollments', e.id,
  case when sd.profile_id is null then 'No student details record'
       when length(trim(coalesce(sd.class_name, ''))) = 0 then 'Student class name is blank'
       else 'No exact class and academic year match' end
from public.enrollments e
left join public.student_details sd on sd.profile_id = e.learner_id
left join public.classes c on c.name = trim(sd.class_name)
left join public.academic_years ay on ay.id = c.academic_year_id
  and ay.name = coalesce(nullif(trim(sd.academic_year), ''), 'Unspecified')
where c.id is null or ay.id is null
on conflict (source_table, source_id) do nothing;

insert into public.academic_migration_issues(source_table, source_id, reason)
select 'subjects', s.id, 'Legacy subject has no class assignment to migrate'
from public.subjects s
where s.instructor_id is not null
  and not exists (select 1 from public.teacher_assignments ta where ta.subject_id = s.id)
on conflict (source_table, source_id) do nothing;

create or replace function public.can_manage_subject(requested_subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select public.current_academy_role()) = 'admin'
    or exists (select 1 from public.teacher_assignments ta
      where ta.subject_id = requested_subject_id and ta.teacher_id = (select auth.uid()))
$$;

create or replace function public.is_enrolled_in_subject(requested_subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e
      where e.subject_id = requested_subject_id and e.learner_id = (select auth.uid()))
    or exists (select 1 from public.student_class_enrollments sce
      join public.teacher_assignments ta on ta.class_id = sce.class_id and ta.subject_id = requested_subject_id
      where sce.student_id = (select auth.uid()))
$$;

create or replace function public.can_manage_class_subject(requested_subject_id uuid, requested_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select public.current_academy_role()) = 'admin'
    or exists (select 1 from public.teacher_assignments ta
      where ta.subject_id = requested_subject_id and ta.class_id = requested_class_id
        and ta.teacher_id = (select auth.uid()))
$$;

create or replace function public.is_enrolled_in_class_subject(requested_subject_id uuid, requested_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.student_class_enrollments sce
      join public.teacher_assignments ta on ta.class_id = sce.class_id and ta.subject_id = requested_subject_id
      where sce.student_id = (select auth.uid()) and sce.class_id = requested_class_id)
    or exists (select 1 from public.enrollments e
      where e.subject_id = requested_subject_id and e.learner_id = (select auth.uid()))
$$;

revoke all on function public.can_manage_class_subject(uuid, uuid) from public, anon;
revoke all on function public.is_enrolled_in_class_subject(uuid, uuid) from public, anon;
grant execute on function public.can_manage_class_subject(uuid, uuid) to authenticated;
grant execute on function public.is_enrolled_in_class_subject(uuid, uuid) to authenticated;

alter table public.academic_years enable row level security;
alter table public.classes enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.student_class_enrollments enable row level security;
alter table public.lessons enable row level security;
alter table public.academic_migration_issues enable row level security;

grant select, insert, update, delete on public.academic_years, public.classes,
  public.teacher_assignments, public.student_class_enrollments to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select on public.academic_migration_issues to authenticated;

drop policy if exists "Academic years are readable by signed in users" on public.academic_years;
drop policy if exists "Admins manage academic years" on public.academic_years;
create policy "Academic years are readable by signed in users" on public.academic_years
  for select to authenticated using (true);
create policy "Admins manage academic years" on public.academic_years
  for all to authenticated using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Users can read relevant classes" on public.classes;
drop policy if exists "Admins manage classes" on public.classes;
create policy "Users can read relevant classes" on public.classes for select to authenticated using (
  (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.teacher_assignments ta where ta.class_id = id and ta.teacher_id = (select auth.uid()))
  or exists (select 1 from public.student_class_enrollments sce where sce.class_id = id and sce.student_id = (select auth.uid()))
);
create policy "Admins manage classes" on public.classes for all to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Relevant users can read teacher assignments" on public.teacher_assignments;
drop policy if exists "Admins manage teacher assignments" on public.teacher_assignments;
create policy "Relevant users can read teacher assignments" on public.teacher_assignments for select to authenticated using (
  teacher_id = (select auth.uid())
  or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.student_class_enrollments sce
    where sce.class_id = teacher_assignments.class_id and sce.student_id = (select auth.uid()))
);
create policy "Admins manage teacher assignments" on public.teacher_assignments for all to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Users can read relevant class enrollments" on public.student_class_enrollments;
drop policy if exists "Admins manage class enrollments" on public.student_class_enrollments;
create policy "Users can read relevant class enrollments" on public.student_class_enrollments for select to authenticated using (
  student_id = (select auth.uid())
  or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.teacher_assignments ta
    where ta.class_id = student_class_enrollments.class_id and ta.teacher_id = (select auth.uid()))
);
create policy "Admins manage class enrollments" on public.student_class_enrollments for all to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Admins can inspect migration issues" on public.academic_migration_issues;
create policy "Admins can inspect migration issues" on public.academic_migration_issues
  for select to authenticated using ((select public.current_academy_role()) = 'admin');

drop policy if exists "Instructors and admins can create subjects" on public.subjects;
drop policy if exists "Subject owners and admins can update subjects" on public.subjects;
drop policy if exists "Subject owners and admins can delete subjects" on public.subjects;
drop policy if exists "Admins manage global subjects" on public.subjects;
create policy "Admins manage global subjects" on public.subjects for all to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Learners and subject instructors can read enrollments" on public.enrollments;
drop policy if exists "Instructors and admins can enroll learners" on public.enrollments;
drop policy if exists "Instructors and admins can remove enrollments" on public.enrollments;
create policy "Relevant users can read legacy subject enrollments" on public.enrollments for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.teacher_assignments ta where ta.subject_id = enrollments.subject_id and ta.teacher_id = (select auth.uid()))
);
create policy "Admins manage legacy subject enrollments" on public.enrollments for all to authenticated
  using ((select public.current_academy_role()) = 'admin') with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Teachers manage assigned lessons" on public.lessons;
drop policy if exists "Students read published lessons in their classes" on public.lessons;
create policy "Teachers manage assigned lessons" on public.lessons for all to authenticated
  using (public.can_manage_class_subject(subject_id, class_id))
  with check (teacher_id = (select auth.uid()) and public.can_manage_class_subject(subject_id, class_id));
create policy "Students read published lessons in their classes" on public.lessons for select to authenticated
  using (is_published and public.is_enrolled_in_class_subject(subject_id, class_id));

-- Scope classroom records to assigned classes while leaving existing nullable-class history readable.
drop policy if exists "Teachers can add classroom documents" on public.classroom_documents;
drop policy if exists "Teachers can update classroom documents" on public.classroom_documents;
drop policy if exists "Teachers can remove classroom documents" on public.classroom_documents;
drop policy if exists "Classroom members can read documents" on public.classroom_documents;
create policy "Classroom members can read documents" on public.classroom_documents for select to authenticated using (
  (class_id is not null and (public.can_manage_class_subject(subject_id, class_id) or public.is_enrolled_in_class_subject(subject_id, class_id)))
  or (class_id is null and (public.can_manage_subject(subject_id) or public.is_enrolled_in_subject(subject_id)))
);
create policy "Assigned teachers manage classroom documents" on public.classroom_documents for all to authenticated
  using (class_id is not null and public.can_manage_class_subject(subject_id, class_id))
  with check (uploaded_by = (select auth.uid()) and class_id is not null and public.can_manage_class_subject(subject_id, class_id));

drop policy if exists "Teachers can create assignments" on public.classroom_assignments;
drop policy if exists "Teachers can update assignments" on public.classroom_assignments;
drop policy if exists "Classroom members can read assignments" on public.classroom_assignments;
create policy "Classroom members can read assignments" on public.classroom_assignments for select to authenticated using (
  (class_id is not null and (public.can_manage_class_subject(subject_id, class_id) or public.is_enrolled_in_class_subject(subject_id, class_id)))
  or (class_id is null and (public.can_manage_subject(subject_id) or public.is_enrolled_in_subject(subject_id)))
);
create policy "Assigned teachers manage assignments" on public.classroom_assignments for all to authenticated
  using (class_id is not null and public.can_manage_class_subject(subject_id, class_id))
  with check (created_by = (select auth.uid()) and class_id is not null and public.can_manage_class_subject(subject_id, class_id));

drop policy if exists "Enrolled learners can submit work" on public.classroom_submissions;
drop policy if exists "Learners can replace their submissions" on public.classroom_submissions;
drop policy if exists "Classroom members can read submissions" on public.classroom_submissions;
create policy "Classroom members can read submissions" on public.classroom_submissions for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.classroom_assignments a where a.id = assignment_id and
    ((a.class_id is not null and public.can_manage_class_subject(a.subject_id, a.class_id))
     or (a.class_id is null and public.can_manage_subject(a.subject_id))))
);
create policy "Enrolled learners submit work in assigned classes" on public.classroom_submissions for insert to authenticated
  with check (learner_id = (select auth.uid()) and exists (
    select 1 from public.classroom_assignments a where a.id = assignment_id
      and public.is_enrolled_in_class_subject(a.subject_id, a.class_id)));
create policy "Learners replace own submissions in enrolled classes" on public.classroom_submissions for update to authenticated
  using (learner_id = (select auth.uid()) and exists (
    select 1 from public.classroom_assignments a where a.id = assignment_id
      and public.is_enrolled_in_class_subject(a.subject_id, a.class_id)))
  with check (learner_id = (select auth.uid()) and exists (
    select 1 from public.classroom_assignments a where a.id = assignment_id
      and public.is_enrolled_in_class_subject(a.subject_id, a.class_id)));

drop policy if exists "Subject instructors and admins can record marks" on public.marks;
create policy "Assigned teachers record marks" on public.marks for insert to authenticated with check (
  recorded_by = (select auth.uid()) and (
    (select public.current_academy_role()) = 'admin'
    or exists (select 1 from public.teacher_assignments ta
      join public.student_class_enrollments sce on sce.class_id = ta.class_id
      where ta.subject_id = marks.subject_id and ta.teacher_id = (select auth.uid())
        and sce.student_id = marks.learner_id)
  )
);

drop policy if exists "Subject instructors and admins can read marks" on public.marks;
drop policy if exists "Learners, subject instructors, and admins can read marks" on public.marks;
create policy "Learners assigned teachers and admins can read marks" on public.marks for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.teacher_assignments ta
    join public.student_class_enrollments sce on sce.class_id = ta.class_id
    where ta.subject_id = marks.subject_id and ta.teacher_id = (select auth.uid()) and sce.student_id = marks.learner_id)
  or exists (select 1 from public.subjects s where s.id = marks.subject_id and s.instructor_id = (select auth.uid()))
);

