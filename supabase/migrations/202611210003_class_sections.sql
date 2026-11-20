-- Add Form 1-6 section support without rewriting existing class records.
alter table public.classes
  add column if not exists stream text not null default '';

alter table public.classes
  drop constraint if exists classes_stream_check;
alter table public.classes
  add constraint classes_stream_check
  check (stream in ('', 'A', 'B', 'C', 'D', 'E'));

-- A grade can now have multiple sections in the same academic year.
alter table public.classes
  drop constraint if exists classes_name_academic_year_id_key;
alter table public.classes
  drop constraint if exists classes_name_stream_academic_year_key;
alter table public.classes
  add constraint classes_name_stream_academic_year_key
  unique (name, stream, academic_year_id);

notify pgrst, 'reload schema';
