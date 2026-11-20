-- Adds class based academic structure while preserving legacy subjects and enrollments.
create table if not exists public.academic_years (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 40),
  created_at timestamptz not null default now()
);

create table if not exists public.academic_terms (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references public.academic_years(id) on delete restrict,
  name text not null check (length(trim(name)) between 1 and 40),
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  unique (academic_year_id, name),
  check (starts_on is null or ends_on is null or ends_on >= starts_on)
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

create table if not exists public.class_subjects (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid not null,
  academic_year_id uuid not null,
  created_at timestamptz not null default now(),
  constraint class_subjects_class_year_fkey
    foreign key (class_id, academic_year_id) references public.classes(id, academic_year_id) on delete restrict,
  unique (subject_id, class_id),
  unique (subject_id, class_id, academic_year_id)
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

create table if not exists public.lesson_completions (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete restrict,
  learner_id uuid not null references public.profiles(id) on delete restrict,
  completed_at timestamptz not null default now(),
  unique (lesson_id, learner_id)
);

alter table public.subjects alter column instructor_id drop not null;
alter table public.subjects add column if not exists description text not null default '';
alter table public.classroom_documents add column if not exists class_id uuid references public.classes(id) on delete restrict;
alter table public.classroom_assignments add column if not exists class_id uuid references public.classes(id) on delete restrict;
alter table public.classroom_attendance add column if not exists class_id uuid references public.classes(id) on delete restrict;
alter table public.marks add column if not exists class_id uuid references public.classes(id) on delete restrict;
alter table public.classroom_assignments add column if not exists assessment_type text not null default 'assignment'
  check (assessment_type in ('assignment', 'quiz'));
alter table public.classroom_assignments add column if not exists quiz_questions jsonb not null default '[]'::jsonb
  check (jsonb_typeof(quiz_questions) = 'array' and jsonb_array_length(quiz_questions) <= 20);

create table if not exists public.classroom_quiz_answer_key (
  assignment_id uuid not null references public.classroom_assignments(id) on delete restrict,
  question_index integer not null check (question_index between 0 and 19),
  correct_option integer not null check (correct_option between 0 and 3),
  primary key (assignment_id, question_index)
);

create table if not exists public.classroom_quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references public.classroom_assignments(id) on delete restrict,
  learner_id uuid not null references public.profiles(id) on delete restrict,
  answers jsonb not null check (jsonb_typeof(answers) = 'array' and jsonb_array_length(answers) <= 20),
  score numeric(7, 2) not null default 0 check (score >= 0),
  submitted_at timestamptz not null default now(),
  unique (assignment_id, learner_id)
);

create or replace function public.validate_classroom_quiz()
returns trigger language plpgsql set search_path = '' as $$
declare
  question jsonb;
begin
  if new.assessment_type = 'quiz' then
    if jsonb_array_length(new.quiz_questions) < 1 then raise exception 'A quiz needs at least one question.'; end if;
    for question in select value from jsonb_array_elements(new.quiz_questions) loop
      if jsonb_typeof(question -> 'prompt') is distinct from 'string'
        or coalesce(length(trim(question ->> 'prompt')), 0) not between 1 and 1000
        or jsonb_typeof(question -> 'options') is distinct from 'array'
        or coalesce(jsonb_array_length(question -> 'options'), 0) <> 4
        or exists (select 1 from jsonb_array_elements_text(question -> 'options') as options(option_value)
          where length(trim(option_value)) not between 1 and 300)
      then raise exception 'Each quiz question needs a prompt and exactly four non-empty answer options.'; end if;
    end loop;
  elsif jsonb_array_length(new.quiz_questions) <> 0 then
    raise exception 'Only quiz assessments can contain quiz questions.';
  end if;
  return new;
end;
$$;

drop trigger if exists validate_classroom_quiz_before_write on public.classroom_assignments;
create trigger validate_classroom_quiz_before_write before insert or update of assessment_type, quiz_questions
  on public.classroom_assignments for each row execute function public.validate_classroom_quiz();

create or replace function public.grade_classroom_quiz_attempt()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  correct_count integer;
  question_count integer;
  maximum_score numeric(7, 2);
begin
  select count(*) into question_count
  from public.classroom_quiz_answer_key k where k.assignment_id = new.assignment_id;
  if question_count <> (select jsonb_array_length(a.quiz_questions)
      from public.classroom_assignments a where a.id = new.assignment_id and a.assessment_type = 'quiz')
  then raise exception 'Quiz answer key is incomplete.'; end if;
  if jsonb_array_length(new.answers) <> question_count
    or exists (select 1 from jsonb_array_elements_text(new.answers) as answers(answer)
      where answer !~ '^[0-3]$')
  then raise exception 'Select one valid answer for every quiz question.'; end if;
  select coalesce(max(a.max_score), 100) into maximum_score
  from public.classroom_assignments a where a.id = new.assignment_id and a.assessment_type = 'quiz';
  if question_count = 0 then raise exception 'This quiz is not ready to be submitted.'; end if;
  select count(*) into correct_count
  from public.classroom_quiz_answer_key k
  where k.assignment_id = new.assignment_id
    and (new.answers ->> k.question_index)::integer = k.correct_option;
  new.score := round(maximum_score * correct_count / question_count, 2);
  return new;
end;
$$;

drop trigger if exists grade_classroom_quiz_attempt_before_write on public.classroom_quiz_attempts;
create trigger grade_classroom_quiz_attempt_before_write
  before insert or update of answers on public.classroom_quiz_attempts
  for each row execute function public.grade_classroom_quiz_attempt();

alter table public.classroom_quiz_answer_key enable row level security;
alter table public.classroom_quiz_attempts enable row level security;
grant select, insert, update, delete on public.classroom_quiz_answer_key to authenticated;
grant select, insert, update on public.classroom_quiz_attempts to authenticated;

drop policy if exists "Teachers manage assigned quiz answer keys" on public.classroom_quiz_answer_key;
create policy "Teachers manage assigned quiz answer keys" on public.classroom_quiz_answer_key for all to authenticated
  using (exists (select 1 from public.classroom_assignments a
    where a.id = assignment_id and a.class_id is not null and public.can_manage_class_subject(a.subject_id, a.class_id)))
  with check (exists (select 1 from public.classroom_assignments a
    where a.id = assignment_id and a.assessment_type = 'quiz' and a.class_id is not null
      and public.can_manage_class_subject(a.subject_id, a.class_id)));

drop policy if exists "Learners and assigned teachers read quiz attempts" on public.classroom_quiz_attempts;
drop policy if exists "Learners submit quiz attempts" on public.classroom_quiz_attempts;
drop policy if exists "Learners and assigned teachers read quiz attempts" on public.classroom_quiz_attempts;
create policy "Learners and assigned teachers read quiz attempts" on public.classroom_quiz_attempts for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.classroom_assignments a where a.id = assignment_id
    and a.class_id is not null and public.can_manage_class_subject(a.subject_id, a.class_id))
);
drop policy if exists "Learners submit quiz attempts" on public.classroom_quiz_attempts;
create policy "Learners submit quiz attempts" on public.classroom_quiz_attempts for insert to authenticated
  with check (learner_id = (select auth.uid()) and exists (
    select 1 from public.classroom_assignments a where a.id = assignment_id and a.assessment_type = 'quiz'
      and a.class_id is not null and public.is_enrolled_in_class_subject(a.subject_id, a.class_id)));

create index if not exists classes_academic_year_idx on public.classes(academic_year_id, name);
create index if not exists teacher_assignments_teacher_class_idx on public.teacher_assignments(teacher_id, class_id);
create index if not exists teacher_assignments_subject_class_idx on public.teacher_assignments(subject_id, class_id);
create index if not exists class_subjects_class_idx on public.class_subjects(class_id, subject_id);
create index if not exists student_class_enrollments_class_idx on public.student_class_enrollments(class_id, student_id);
create index if not exists lessons_class_subject_created_idx on public.lessons(class_id, subject_id, created_at desc);
create index if not exists lesson_completions_learner_idx on public.lesson_completions(learner_id, completed_at desc);
create index if not exists classroom_documents_class_subject_idx on public.classroom_documents(class_id, subject_id, created_at desc);
create index if not exists classroom_assignments_class_subject_idx on public.classroom_assignments(class_id, subject_id, created_at desc);
create index if not exists marks_class_subject_learner_idx on public.marks(class_id, subject_id, learner_id);

-- Legacy class labels and years are copied only when both values are present.
insert into public.academic_years(name)
select distinct trim(sd.academic_year)
from public.student_details sd
where length(trim(coalesce(sd.academic_year, ''))) > 0
on conflict do nothing;

insert into public.classes(name, grade, academic_year_id)
select distinct trim(sd.class_name), trim(sd.class_name), ay.id
from public.student_details sd
join public.academic_years ay
  on ay.name = trim(sd.academic_year)
where length(trim(coalesce(sd.class_name, ''))) > 0
  and length(trim(coalesce(sd.academic_year, ''))) > 0
on conflict do nothing;

-- Preserve each old per-subject enrollee as a class enrollee using exact class/year matches.
insert into public.student_class_enrollments(student_id, class_id, academic_year_id)
select distinct e.learner_id, c.id, c.academic_year_id
from public.enrollments e
join public.student_details sd on sd.profile_id = e.learner_id
join public.classes c
  on c.name = trim(sd.class_name)
join public.academic_years ay on ay.id = c.academic_year_id
  and ay.name = trim(sd.academic_year)
where length(trim(coalesce(sd.class_name, ''))) > 0
  and length(trim(coalesce(sd.academic_year, ''))) > 0
on conflict do nothing;

-- Carry the prior single subject owner forward for each class where that subject was enrolled.
insert into public.teacher_assignments(teacher_id, subject_id, class_id, academic_year_id)
select distinct s.instructor_id, e.subject_id, c.id, c.academic_year_id
from public.enrollments e
join public.subjects s on s.id = e.subject_id
join public.student_details sd on sd.profile_id = e.learner_id
join public.classes c on c.name = trim(sd.class_name)
join public.academic_years ay on ay.id = c.academic_year_id
  and ay.name = trim(sd.academic_year)
where s.instructor_id is not null
  and length(trim(coalesce(sd.class_name, ''))) > 0
  and length(trim(coalesce(sd.academic_year, ''))) > 0
on conflict do nothing;

insert into public.class_subjects(subject_id, class_id, academic_year_id)
select distinct subject_id, class_id, academic_year_id from public.teacher_assignments
on conflict do nothing;

insert into public.class_subjects(subject_id, class_id, academic_year_id)
select distinct e.subject_id, sce.class_id, sce.academic_year_id
from public.enrollments e
join public.student_class_enrollments sce on sce.student_id = e.learner_id
on conflict do nothing;

-- Keep the role relationships valid for direct authenticated inserts as well as UI forms.
create or replace function public.validate_academic_party_roles()
returns trigger language plpgsql set search_path = '' as $$
declare
  expected_role text;
  profile_role text;
begin
  expected_role := case when tg_table_name = 'teacher_assignments' then 'instructor' else 'learner' end;
  if tg_table_name = 'teacher_assignments' then
    select p.role::text into profile_role from public.profiles p where p.id = new.teacher_id;
  else
    select p.role::text into profile_role from public.profiles p where p.id = new.student_id;
  end if;
  if profile_role is distinct from expected_role then
    raise exception 'Academic record requires a profile with role %.', expected_role;
  end if;
  return new;
end;
$$;

drop trigger if exists validate_teacher_assignment_role on public.teacher_assignments;
create trigger validate_teacher_assignment_role before insert or update of teacher_id
  on public.teacher_assignments for each row execute function public.validate_academic_party_roles();
drop trigger if exists validate_student_class_enrollment_role on public.student_class_enrollments;
create trigger validate_student_class_enrollment_role before insert or update of student_id
  on public.student_class_enrollments for each row execute function public.validate_academic_party_roles();

do $$ begin
  alter table public.teacher_assignments add constraint teacher_assignments_class_subject_fkey
    foreign key (subject_id, class_id, academic_year_id)
    references public.class_subjects(subject_id, class_id, academic_year_id) on delete restrict;
exception when duplicate_object then null;
end; $$;

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
       when length(trim(coalesce(sd.academic_year, ''))) = 0 then 'Student academic year is blank'
       else 'No exact class and academic year match' end
from public.enrollments e
left join public.student_details sd on sd.profile_id = e.learner_id
left join public.classes c on c.name = trim(sd.class_name)
left join public.academic_years ay on ay.id = c.academic_year_id
  and ay.name = trim(sd.academic_year)
where c.id is null or ay.id is null
on conflict do nothing;

insert into public.academic_migration_issues(source_table, source_id, reason)
select 'subjects', s.id, 'Legacy subject has no class assignment to migrate'
from public.subjects s
where s.instructor_id is not null
  and not exists (select 1 from public.teacher_assignments ta where ta.subject_id = s.id)
on conflict do nothing;

create or replace function public.can_manage_subject(requested_subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select public.current_academy_role()) = 'admin'
    or exists (select 1 from public.teacher_assignments ta
      where ta.subject_id = requested_subject_id and ta.teacher_id = (select auth.uid()))
$$;

create or replace function public.lookup_subject_profiles(requested_ids uuid[])
returns table (id uuid, username text, full_name text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.username, p.full_name
  from public.profiles p
  where p.id = any(coalesce(requested_ids, '{}'::uuid[]))
    and (p.id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
      or exists (select 1 from public.teacher_assignments ta
        join public.student_class_enrollments sce on sce.class_id = ta.class_id
        where ta.teacher_id = (select auth.uid()) and sce.student_id = p.id)
      or exists (select 1 from public.teacher_assignments ta
        join public.student_class_enrollments sce on sce.class_id = ta.class_id
        where ta.teacher_id = p.id and sce.student_id = (select auth.uid())))
$$;

create or replace function public.lookup_learner_for_enrollment(requested_registration_number text)
returns table (id uuid, full_name text, registration_number text)
language sql stable security definer set search_path = '' as $$
  select p.id, p.full_name, sd.registration_number
  from public.student_details sd join public.profiles p on p.id = sd.profile_id
  where lower(trim(sd.registration_number)) = lower(trim(requested_registration_number))
    and p.role = 'learner' and (select public.current_academy_role()) = 'admin'
  limit 1
$$;

create or replace function public.is_enrolled_in_subject(requested_subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.enrollments e
      where e.subject_id = requested_subject_id and e.learner_id = (select auth.uid()))
    or exists (select 1 from public.student_class_enrollments sce
      join public.class_subjects cs on cs.class_id = sce.class_id and cs.subject_id = requested_subject_id
      where sce.student_id = (select auth.uid()))
$$;

create or replace function public.can_manage_class_subject(requested_subject_id uuid, requested_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select public.current_academy_role()) = 'admin'
    or exists (select 1 from public.teacher_assignments ta
      where ta.subject_id = requested_subject_id and ta.class_id = requested_class_id
        and ta.teacher_id = (select auth.uid()))
$$;

create or replace function public.can_manage_legacy_subject(requested_subject_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select (select public.current_academy_role()) = 'admin'
    or exists (select 1 from public.teacher_assignments mine
      where mine.subject_id = requested_subject_id and mine.teacher_id = (select auth.uid())
        and not exists (select 1 from public.class_subjects other_class
          where other_class.subject_id = requested_subject_id and other_class.class_id <> mine.class_id))
$$;

create or replace function public.is_enrolled_in_class_subject(requested_subject_id uuid, requested_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.student_class_enrollments sce
      join public.class_subjects cs on cs.class_id = sce.class_id and cs.subject_id = requested_subject_id
      where sce.student_id = (select auth.uid()) and sce.class_id = requested_class_id)
$$;

create or replace function public.is_enrolled_in_class(requested_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.student_class_enrollments sce
    where sce.class_id = requested_class_id and sce.student_id = (select auth.uid()))
$$;

create or replace function public.is_teacher_assigned_to_class(requested_class_id uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.teacher_assignments ta
    where ta.class_id = requested_class_id and ta.teacher_id = (select auth.uid()))
$$;

revoke all on function public.can_manage_class_subject(uuid, uuid) from public, anon;
revoke all on function public.can_manage_legacy_subject(uuid) from public, anon;
revoke all on function public.is_enrolled_in_class_subject(uuid, uuid) from public, anon;
grant execute on function public.can_manage_class_subject(uuid, uuid) to authenticated;
grant execute on function public.can_manage_legacy_subject(uuid) to authenticated;
grant execute on function public.is_enrolled_in_class_subject(uuid, uuid) to authenticated;
revoke all on function public.is_enrolled_in_class(uuid) from public, anon;
revoke all on function public.is_teacher_assigned_to_class(uuid) from public, anon;
grant execute on function public.is_enrolled_in_class(uuid) to authenticated;
grant execute on function public.is_teacher_assigned_to_class(uuid) to authenticated;

alter table public.academic_years enable row level security;
alter table public.academic_terms enable row level security;
alter table public.classes enable row level security;
alter table public.teacher_assignments enable row level security;
alter table public.class_subjects enable row level security;
alter table public.student_class_enrollments enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_completions enable row level security;
alter table public.academic_migration_issues enable row level security;

grant select, insert, update, delete on public.academic_years, public.classes,
  public.teacher_assignments, public.student_class_enrollments to authenticated;
grant select, insert, update, delete on public.academic_terms to authenticated;
grant select, insert, update, delete on public.class_subjects to authenticated;
grant select, insert, update, delete on public.lessons to authenticated;
grant select, insert, delete on public.lesson_completions to authenticated;
grant select on public.academic_migration_issues to authenticated;

drop policy if exists "Academic years are readable by signed in users" on public.academic_years;
drop policy if exists "Admins manage academic years" on public.academic_years;
drop policy if exists "Academic years are readable by signed in users" on public.academic_years;
create policy "Academic years are readable by signed in users" on public.academic_years
  for select to authenticated using (true);
drop policy if exists "Admins manage academic years" on public.academic_years;
create policy "Admins manage academic years" on public.academic_years
  for all to authenticated using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Signed in users read academic terms" on public.academic_terms;
drop policy if exists "Admins manage academic terms" on public.academic_terms;
drop policy if exists "Signed in users read academic terms" on public.academic_terms;
create policy "Signed in users read academic terms" on public.academic_terms for select to authenticated using (true);
drop policy if exists "Admins manage academic terms" on public.academic_terms;
create policy "Admins manage academic terms" on public.academic_terms for all to authenticated
  using ((select public.current_academy_role()) = 'admin') with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Users can read relevant classes" on public.classes;
drop policy if exists "Admins manage classes" on public.classes;
drop policy if exists "Users can read relevant classes" on public.classes;
create policy "Users can read relevant classes" on public.classes for select to authenticated using (
  (select public.current_academy_role()) = 'admin'
  or public.is_teacher_assigned_to_class(id)
  or public.is_enrolled_in_class(id)
);
drop policy if exists "Admins manage classes" on public.classes;
create policy "Admins manage classes" on public.classes for all to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Relevant users can read teacher assignments" on public.teacher_assignments;
drop policy if exists "Admins manage teacher assignments" on public.teacher_assignments;
drop policy if exists "Relevant users can read teacher assignments" on public.teacher_assignments;
create policy "Relevant users can read teacher assignments" on public.teacher_assignments for select to authenticated using (
  teacher_id = (select auth.uid())
  or (select public.current_academy_role()) = 'admin'
  or public.is_enrolled_in_class(teacher_assignments.class_id)
);
drop policy if exists "Admins manage teacher assignments" on public.teacher_assignments;
create policy "Admins manage teacher assignments" on public.teacher_assignments for all to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Users can read offered class subjects" on public.class_subjects;
drop policy if exists "Admins manage class subjects" on public.class_subjects;
drop policy if exists "Users can read offered class subjects" on public.class_subjects;
create policy "Users can read offered class subjects" on public.class_subjects for select to authenticated using (
  (select public.current_academy_role()) = 'admin'
  or public.is_teacher_assigned_to_class(class_id)
  or public.is_enrolled_in_class(class_id)
);
drop policy if exists "Admins manage class subjects" on public.class_subjects;
create policy "Admins manage class subjects" on public.class_subjects for all to authenticated
  using ((select public.current_academy_role()) = 'admin') with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Users can read relevant class enrollments" on public.student_class_enrollments;
drop policy if exists "Admins manage class enrollments" on public.student_class_enrollments;
drop policy if exists "Users can read relevant class enrollments" on public.student_class_enrollments;
create policy "Users can read relevant class enrollments" on public.student_class_enrollments for select to authenticated using (
  student_id = (select auth.uid())
  or (select public.current_academy_role()) = 'admin'
  or public.is_teacher_assigned_to_class(student_class_enrollments.class_id)
);
drop policy if exists "Admins manage class enrollments" on public.student_class_enrollments;
create policy "Admins manage class enrollments" on public.student_class_enrollments for all to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Admins can inspect migration issues" on public.academic_migration_issues;
create policy "Admins can inspect migration issues" on public.academic_migration_issues
  for select to authenticated using ((select public.current_academy_role()) = 'admin');

drop policy if exists "Instructors and admins can create subjects" on public.subjects;
drop policy if exists "Subject owners and admins can update subjects" on public.subjects;
drop policy if exists "Subject owners and admins can delete subjects" on public.subjects;
drop policy if exists "Authenticated users can read subjects" on public.subjects;
drop policy if exists "Users can read assigned or enrolled subjects" on public.subjects;
drop policy if exists "Admins manage global subjects" on public.subjects;
revoke delete on public.subjects from authenticated;
drop policy if exists "Users can read assigned or enrolled subjects" on public.subjects;
create policy "Users can read assigned or enrolled subjects" on public.subjects for select to authenticated using (
  (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.teacher_assignments ta where ta.subject_id = subjects.id and ta.teacher_id = (select auth.uid()))
  or exists (select 1 from public.class_subjects cs join public.student_class_enrollments sce on sce.class_id = cs.class_id
    where cs.subject_id = subjects.id and sce.student_id = (select auth.uid()))
  or exists (select 1 from public.enrollments e where e.subject_id = subjects.id and e.learner_id = (select auth.uid()))
);
drop policy if exists "Admins create global subjects" on public.subjects;
drop policy if exists "Admins update global subjects" on public.subjects;
drop policy if exists "Admins create global subjects" on public.subjects;
create policy "Admins create global subjects" on public.subjects for insert to authenticated
  with check ((select public.current_academy_role()) = 'admin');
drop policy if exists "Admins update global subjects" on public.subjects;
create policy "Admins update global subjects" on public.subjects for update to authenticated
  using ((select public.current_academy_role()) = 'admin')
  with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Learners and subject instructors can read enrollments" on public.enrollments;
drop policy if exists "Instructors and admins can enroll learners" on public.enrollments;
drop policy if exists "Instructors and admins can remove enrollments" on public.enrollments;
drop policy if exists "Relevant users can read legacy subject enrollments" on public.enrollments;
create policy "Relevant users can read legacy subject enrollments" on public.enrollments for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.teacher_assignments ta where ta.subject_id = enrollments.subject_id and ta.teacher_id = (select auth.uid()))
);
drop policy if exists "Admins manage legacy subject enrollments" on public.enrollments;
create policy "Admins manage legacy subject enrollments" on public.enrollments for all to authenticated
  using ((select public.current_academy_role()) = 'admin') with check ((select public.current_academy_role()) = 'admin');

drop policy if exists "Teachers manage assigned lessons" on public.lessons;
drop policy if exists "Students read published lessons in their classes" on public.lessons;
drop policy if exists "Teachers manage assigned lessons" on public.lessons;
create policy "Teachers manage assigned lessons" on public.lessons for all to authenticated
  using (public.can_manage_class_subject(subject_id, class_id))
  with check (teacher_id = (select auth.uid()) and public.can_manage_class_subject(subject_id, class_id));
drop policy if exists "Students read published lessons in their classes" on public.lessons;
create policy "Students read published lessons in their classes" on public.lessons for select to authenticated
  using (is_published and public.is_enrolled_in_class_subject(subject_id, class_id));

drop policy if exists "Learners read their lesson completions" on public.lesson_completions;
drop policy if exists "Learners complete published enrolled lessons" on public.lesson_completions;
drop policy if exists "Learners undo their lesson completions" on public.lesson_completions;
drop policy if exists "Learners read their lesson completions" on public.lesson_completions;
create policy "Learners read their lesson completions" on public.lesson_completions for select to authenticated
  using (learner_id = (select auth.uid()));
drop policy if exists "Learners complete published enrolled lessons" on public.lesson_completions;
create policy "Learners complete published enrolled lessons" on public.lesson_completions for insert to authenticated
  with check (learner_id = (select auth.uid()) and exists (
    select 1 from public.lessons l where l.id = lesson_id and l.is_published
      and public.is_enrolled_in_class_subject(l.subject_id, l.class_id)));
drop policy if exists "Learners undo their lesson completions" on public.lesson_completions;
create policy "Learners undo their lesson completions" on public.lesson_completions for delete to authenticated
  using (learner_id = (select auth.uid()));

-- Scope classroom records to assigned classes while leaving existing nullable-class history readable.
drop policy if exists "Teachers can add classroom documents" on public.classroom_documents;
drop policy if exists "Teachers can update classroom documents" on public.classroom_documents;
drop policy if exists "Teachers can remove classroom documents" on public.classroom_documents;
drop policy if exists "Classroom members can read documents" on public.classroom_documents;
create policy "Classroom members can read documents" on public.classroom_documents for select to authenticated using (
  (class_id is not null and (public.can_manage_class_subject(subject_id, class_id) or public.is_enrolled_in_class_subject(subject_id, class_id)))
  or (class_id is null and ((select public.current_academy_role()) = 'admin'
    or public.can_manage_legacy_subject(subject_id)
    or ((select public.current_academy_role()) = 'learner' and public.is_enrolled_in_subject(subject_id))))
);
drop policy if exists "Assigned teachers manage classroom documents" on public.classroom_documents;
create policy "Assigned teachers manage classroom documents" on public.classroom_documents for all to authenticated
  using (class_id is not null and public.can_manage_class_subject(subject_id, class_id))
  with check (uploaded_by = (select auth.uid()) and class_id is not null and public.can_manage_class_subject(subject_id, class_id));
drop policy if exists "Admins manage legacy classless documents" on public.classroom_documents;
create policy "Admins manage legacy classless documents" on public.classroom_documents for all to authenticated
  using (class_id is null and (select public.current_academy_role()) = 'admin')
  with check (class_id is null and (select public.current_academy_role()) = 'admin');

drop policy if exists "Teachers can create assignments" on public.classroom_assignments;
drop policy if exists "Teachers can update assignments" on public.classroom_assignments;
drop policy if exists "Classroom members can read assignments" on public.classroom_assignments;
create policy "Classroom members can read assignments" on public.classroom_assignments for select to authenticated using (
  (class_id is not null and (public.can_manage_class_subject(subject_id, class_id) or public.is_enrolled_in_class_subject(subject_id, class_id)))
  or (class_id is null and ((select public.current_academy_role()) = 'admin'
    or public.can_manage_legacy_subject(subject_id)
    or ((select public.current_academy_role()) = 'learner' and public.is_enrolled_in_subject(subject_id))))
);
drop policy if exists "Assigned teachers manage assignments" on public.classroom_assignments;
create policy "Assigned teachers manage assignments" on public.classroom_assignments for all to authenticated
  using (class_id is not null and public.can_manage_class_subject(subject_id, class_id))
  with check (created_by = (select auth.uid()) and class_id is not null and public.can_manage_class_subject(subject_id, class_id));
drop policy if exists "Admins manage legacy classless assignments" on public.classroom_assignments;
create policy "Admins manage legacy classless assignments" on public.classroom_assignments for all to authenticated
  using (class_id is null and (select public.current_academy_role()) = 'admin')
  with check (class_id is null and (select public.current_academy_role()) = 'admin');

drop policy if exists "Classroom members can read attendance" on public.classroom_attendance;
drop policy if exists "Teachers can record attendance" on public.classroom_attendance;
drop policy if exists "Teachers can update attendance" on public.classroom_attendance;
drop policy if exists "Class members can read attendance" on public.classroom_attendance;
create policy "Class members can read attendance" on public.classroom_attendance for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or (class_id is not null and public.can_manage_class_subject(subject_id, class_id))
  or (class_id is null and public.can_manage_legacy_subject(subject_id))
);
drop policy if exists "Assigned teachers manage attendance" on public.classroom_attendance;
create policy "Assigned teachers manage attendance" on public.classroom_attendance for all to authenticated
  using (class_id is not null and public.can_manage_class_subject(subject_id, class_id))
  with check (recorded_by = (select auth.uid()) and class_id is not null
    and public.can_manage_class_subject(subject_id, class_id)
    and public.is_enrolled_in_class_subject(subject_id, class_id));

drop policy if exists "Enrolled learners can submit work" on public.classroom_submissions;
drop policy if exists "Learners can replace their submissions" on public.classroom_submissions;
drop policy if exists "Classroom members can read submissions" on public.classroom_submissions;
create policy "Classroom members can read submissions" on public.classroom_submissions for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.classroom_assignments a where a.id = assignment_id and
    ((a.class_id is not null and public.can_manage_class_subject(a.subject_id, a.class_id))
     or (a.class_id is null and ((select public.current_academy_role()) = 'admin'
       or public.can_manage_legacy_subject(a.subject_id)))))
);
drop policy if exists "Enrolled learners submit work in assigned classes" on public.classroom_submissions;
create policy "Enrolled learners submit work in assigned classes" on public.classroom_submissions for insert to authenticated
  with check (learner_id = (select auth.uid()) and exists (
    select 1 from public.classroom_assignments a where a.id = assignment_id
      and ((a.class_id is not null and public.is_enrolled_in_class_subject(a.subject_id, a.class_id))
        or (a.class_id is null and public.is_enrolled_in_subject(a.subject_id)))));
drop policy if exists "Learners replace own submissions in enrolled classes" on public.classroom_submissions;
create policy "Learners replace own submissions in enrolled classes" on public.classroom_submissions for update to authenticated
  using (learner_id = (select auth.uid()) and exists (
    select 1 from public.classroom_assignments a where a.id = assignment_id
      and ((a.class_id is not null and public.is_enrolled_in_class_subject(a.subject_id, a.class_id))
        or (a.class_id is null and public.is_enrolled_in_subject(a.subject_id)))))
  with check (learner_id = (select auth.uid()) and exists (
    select 1 from public.classroom_assignments a where a.id = assignment_id
      and ((a.class_id is not null and public.is_enrolled_in_class_subject(a.subject_id, a.class_id))
        or (a.class_id is null and public.is_enrolled_in_subject(a.subject_id)))));

drop policy if exists "Subject instructors and admins can record marks" on public.marks;
drop policy if exists "Mark authors and admins can update marks" on public.marks;
drop policy if exists "Mark authors and admins can delete marks" on public.marks;
drop policy if exists "Assigned teachers record marks" on public.marks;
create policy "Assigned teachers record marks" on public.marks for insert to authenticated with check (
  recorded_by = (select auth.uid()) and (
    (select public.current_academy_role()) = 'admin'
    or exists (select 1 from public.teacher_assignments ta
      join public.student_class_enrollments sce on sce.class_id = ta.class_id
      where ta.subject_id = marks.subject_id and ta.class_id = marks.class_id
        and ta.teacher_id = (select auth.uid())
        and sce.student_id = marks.learner_id)
  )
);

drop policy if exists "Subject instructors and admins can read marks" on public.marks;
drop policy if exists "Learners, subject instructors, and admins can read marks" on public.marks;
drop policy if exists "Learners assigned teachers and admins can read marks" on public.marks;
create policy "Learners assigned teachers and admins can read marks" on public.marks for select to authenticated using (
  learner_id = (select auth.uid()) or (select public.current_academy_role()) = 'admin'
  or exists (select 1 from public.teacher_assignments ta
    join public.student_class_enrollments sce on sce.class_id = ta.class_id
    where ta.subject_id = marks.subject_id and ta.class_id = marks.class_id
      and ta.teacher_id = (select auth.uid()) and sce.student_id = marks.learner_id)
  or (marks.class_id is null and public.can_manage_legacy_subject(marks.subject_id))
);
drop policy if exists "Assigned teachers update marks" on public.marks;
create policy "Assigned teachers update marks" on public.marks for update to authenticated
  using (
    (select public.current_academy_role()) = 'admin'
    or exists (
    select 1 from public.teacher_assignments ta
    join public.student_class_enrollments sce on sce.class_id = ta.class_id
    where ta.subject_id = marks.subject_id and ta.class_id = marks.class_id
      and ta.teacher_id = (select auth.uid()) and sce.student_id = marks.learner_id)
    or (marks.class_id is null and recorded_by = (select auth.uid())
      and public.can_manage_legacy_subject(marks.subject_id))
  )
  with check (
    (select public.current_academy_role()) = 'admin'
    or (recorded_by = (select auth.uid()) and (
      (marks.class_id is null and public.can_manage_legacy_subject(marks.subject_id))
      or exists (
    select 1 from public.teacher_assignments ta
    join public.student_class_enrollments sce on sce.class_id = ta.class_id
        where ta.subject_id = marks.subject_id and ta.class_id = marks.class_id
          and ta.teacher_id = (select auth.uid()) and sce.student_id = marks.learner_id
      )
    ))
  );
drop policy if exists "Admins delete marks" on public.marks;
create policy "Admins delete marks" on public.marks for delete to authenticated
  using ((select public.current_academy_role()) = 'admin');

drop policy if exists "Enrolled learners and their instructors can start conversations" on public.conversations;
drop policy if exists "Assigned teachers and enrolled learners can start conversations" on public.conversations;
create policy "Assigned teachers and enrolled learners can start conversations" on public.conversations for insert to authenticated
with check (
  exists (select 1 from public.teacher_assignments ta
    join public.student_class_enrollments sce on sce.class_id = ta.class_id
    where ta.subject_id = conversations.subject_id and ta.teacher_id = conversations.instructor_id
      and sce.student_id = conversations.learner_id
      and (select auth.uid()) in (conversations.learner_id, conversations.instructor_id))
  or exists (select 1 from public.subjects s join public.enrollments e on e.subject_id = s.id
    where s.id = conversations.subject_id and s.instructor_id = conversations.instructor_id
      and e.learner_id = conversations.learner_id
      and (select auth.uid()) in (conversations.learner_id, conversations.instructor_id))
);

-- Class-aware object paths isolate uploads and downloads when a subject has multiple teachers.
drop policy if exists "Classroom members can download materials" on storage.objects;
drop policy if exists "Teachers can upload materials" on storage.objects;
drop policy if exists "Teachers can delete unlinked materials" on storage.objects;
drop policy if exists "Learners and admins download legacy materials" on storage.objects;
create policy "Learners and admins download legacy materials" on storage.objects for select to authenticated using (
  bucket_id = 'classroom-files' and (storage.foldername(name))[1] = 'subjects'
  and (storage.foldername(name))[3] = 'materials'
  and exists (select 1 from public.subjects s where s.id::text = (storage.foldername(name))[2]
    and ((select public.current_academy_role()) = 'admin'
      or public.can_manage_legacy_subject(s.id)
      or ((select public.current_academy_role()) = 'learner' and public.is_enrolled_in_subject(s.id))))
);
drop policy if exists "Classroom members can download submissions" on storage.objects;
drop policy if exists "Learners and admins download legacy submissions" on storage.objects;
create policy "Learners and admins download legacy submissions" on storage.objects for select to authenticated using (
  bucket_id = 'classroom-files' and (storage.foldername(name))[1] = 'subjects'
  and (storage.foldername(name))[3] = 'submissions'
  and exists (select 1 from public.classroom_assignments a where a.id::text = (storage.foldername(name))[4]
    and a.subject_id::text = (storage.foldername(name))[2]
    and ((select public.current_academy_role()) = 'admin'
      or public.can_manage_legacy_subject(a.subject_id)
      or ((select public.current_academy_role()) = 'learner'
        and (storage.foldername(name))[5] = (select auth.uid())::text
        and public.is_enrolled_in_subject(a.subject_id))))
);
drop policy if exists "Assigned class members download class materials" on storage.objects;
create policy "Assigned class members download class materials" on storage.objects for select to authenticated using (
  bucket_id = 'classroom-files' and (storage.foldername(name))[1] = 'subjects'
  and (storage.foldername(name))[3] = 'classes' and (storage.foldername(name))[5] = 'materials'
  and exists (select 1 from public.subjects s
    where s.id::text = (storage.foldername(name))[2] and s.archived_at is null
      and (public.can_manage_class_subject(s.id, (storage.foldername(name))[4]::uuid)
        or public.is_enrolled_in_class_subject(s.id, (storage.foldername(name))[4]::uuid)))
);
drop policy if exists "Assigned teachers upload class materials" on storage.objects;
create policy "Assigned teachers upload class materials" on storage.objects for insert to authenticated with check (
  bucket_id = 'classroom-files' and (storage.foldername(name))[1] = 'subjects'
  and (storage.foldername(name))[3] = 'classes' and (storage.foldername(name))[5] = 'materials'
  and exists (select 1 from public.subjects s
    where s.id::text = (storage.foldername(name))[2] and s.archived_at is null
      and public.can_manage_class_subject(s.id, (storage.foldername(name))[4]::uuid))
);
drop policy if exists "Assigned teachers remove unlinked class materials" on storage.objects;
create policy "Assigned teachers remove unlinked class materials" on storage.objects for delete to authenticated using (
  bucket_id = 'classroom-files' and (storage.foldername(name))[1] = 'subjects'
  and (storage.foldername(name))[3] = 'classes' and (storage.foldername(name))[5] = 'materials'
  and public.can_manage_class_subject((storage.foldername(name))[2]::uuid, (storage.foldername(name))[4]::uuid)
  and not exists (select 1 from public.classroom_documents d where d.storage_path = storage.objects.name)
);
drop policy if exists "Assigned class members download submissions" on storage.objects;
create policy "Assigned class members download submissions" on storage.objects for select to authenticated using (
  bucket_id = 'classroom-files' and (storage.foldername(name))[1] = 'subjects'
  and (storage.foldername(name))[3] = 'classes' and (storage.foldername(name))[5] = 'submissions'
  and exists (select 1 from public.classroom_assignments a
    where a.id::text = (storage.foldername(name))[6]
      and a.subject_id::text = (storage.foldername(name))[2]
      and a.class_id::text = (storage.foldername(name))[4]
      and (public.can_manage_class_subject(a.subject_id, a.class_id)
        or ((storage.foldername(name))[7] = (select auth.uid())::text
          and public.is_enrolled_in_class_subject(a.subject_id, a.class_id))))
);
drop policy if exists "Enrolled learners upload class submissions" on storage.objects;
create policy "Enrolled learners upload class submissions" on storage.objects for insert to authenticated with check (
  bucket_id = 'classroom-files' and (storage.foldername(name))[1] = 'subjects'
  and (storage.foldername(name))[3] = 'classes' and (storage.foldername(name))[5] = 'submissions'
  and (storage.foldername(name))[7] = (select auth.uid())::text
  and exists (select 1 from public.classroom_assignments a join public.subjects s on s.id = a.subject_id
    where a.id::text = (storage.foldername(name))[6]
      and a.subject_id::text = (storage.foldername(name))[2]
      and a.class_id::text = (storage.foldername(name))[4]
      and s.archived_at is null and public.is_enrolled_in_class_subject(a.subject_id, a.class_id))
);
drop policy if exists "Learners delete unlinked class submissions" on storage.objects;
create policy "Learners delete unlinked class submissions" on storage.objects for delete to authenticated using (
  bucket_id = 'classroom-files' and (storage.foldername(name))[3] = 'classes'
  and (storage.foldername(name))[5] = 'submissions'
  and (storage.foldername(name))[7] = (select auth.uid())::text
  and not exists (select 1 from public.classroom_submissions cs where cs.storage_path = storage.objects.name)
);

-- PowerPoint files are supported alongside the existing PDF and Word resources.
alter table public.classroom_documents drop constraint if exists classroom_documents_mime_type_check;
alter table public.classroom_documents add constraint classroom_documents_mime_type_check check (
  mime_type in ('application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation')
);
alter table public.classroom_submissions drop constraint if exists classroom_submissions_mime_type_check;
alter table public.classroom_submissions add constraint classroom_submissions_mime_type_check check (
  mime_type in ('application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation')
);
update storage.buckets set allowed_mime_types = array[
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation'
] where id = 'classroom-files';

