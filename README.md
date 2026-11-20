# St Dzikaz Academy

Next.js learning platform with Supabase Authentication and Postgres. Events, notices, subjects, marks, and private instructor/learner conversations use the schema and row-level security policies in `supabase/migrations`.

## Local setup

1. Install Node.js 24.22.1 or later and pnpm 10.11.0.
2. Run `pnpm install`.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase project settings.
4. Initialize/link the Supabase CLI to your project, then apply the schema with `supabase db push`.
5. Set the Supabase Auth site URL and redirect allowlist to your local and deployed app URLs.
6. Run `pnpm dev`.

The browser only uses the Supabase URL and publishable anon key. Never expose a Supabase service-role key in `NEXT_PUBLIC_*`, the repository, or Vercel.

## Supabase schema

| Table | Purpose |
| --- | --- |
| `profiles` | Supabase Auth user profile, editable unique username, bio, avatar URL, academy role, and first-login password change flag. Supabase Auth handles passwords; they are never stored in this table. |
| `profile-avatars` Storage bucket | Public profile photos. Each signed-in user can upload or replace only their own avatar. |
| `student_details` | Private registration number, class, date of birth, contact number, academic year, and gender imported from the workbook. Visible only to the student and administrators. |
| `subjects` | ZIMSEC subjects, level, syllabus code, and instructor. |
| `enrollments` | Learners enrolled in subjects. |
| `events` | Scheduled events, audience, and venue. |
| `notices` | Announcements and audience. |
| `marks` | Student assessment scores, maximum score, date, feedback, subject, and recording instructor. |
| `lessons` / `lesson_completions` | Class-scoped lesson content and per-learner completion records, protected by row-level security. |
| `academy_settings` | Public academy display name, editable by administrators. |
| `conversations` | Private learner/instructor conversation scoped to an enrolled subject. |
| `messages` | Messages and read status within a conversation. |

The migration creates the Auth profile trigger and role-based RLS policies. `supabase db push` requires the Supabase CLI; if needed, run `supabase init`, `supabase login`, and `supabase link --project-ref <project-ref>` first. Keep the existing migration file when initializing.

If learner signup reports “Database error saving new user,” apply `supabase/migrations/202611180002_repair_auth_profile_signup.sql` to the connected Supabase project. For a project where the original schema is already installed, run this new repair migration in the Supabase Dashboard SQL Editor; do not rerun the original schema file. The repair updates the Auth trigger to generate the required unique profile username.

If learner signup fails because `student_details.registration_number` is null, apply `supabase/migrations/202611180003_allow_optional_registration_number.sql` to the connected Supabase project. It aligns older databases with the current schema, where registration numbers are optional for email signups, and preserves existing registration numbers.

Admins and other existing users sign in with their email address. The academy dashboard is also available at `/admin/` (including its trailing slash).
Gmail addresses are supported for email/password sign-in and signup. In Supabase Auth, keep the email provider enabled and configure the app's site URL and redirect allowlist for both the site root and `/admin/`.

The classroom workflow is in `supabase/migrations/202611180001_classroom_workflows.sql`. Apply it with `supabase db push` before using classroom pages. It adds subject archiving, student enrollment by registration number, classroom documents, assignments and submissions, attendance, and the private `classroom-files` Storage bucket. Classroom and submitted files are limited to PDF/DOC/DOCX/PPTX and 10 MB. Archived subjects keep their records and are read-only.

Role-based academic management is in `supabase/migrations/202611210001_academic_structure.sql`. Apply it with `supabase db push` before using Admin Classes & Grades, Subjects, Teacher Assignments, Student Enrolments, or teacher workspaces. It adds academic years/terms, classes, class-subject offerings, teacher assignments, class enrolments, lessons, and multiple-choice quizzes. Existing teacher ownership and learner subject enrollments are mapped only when class name and academic year both match exactly; unmatched records remain unchanged and are listed in the Admin Academic Reports review section. New assignments are scoped by class using row-level security.

Lesson progress is stored per published lesson in `lesson_completions`, created by `supabase/migrations/202611210001_academic_structure.sql`. Learners can mark their own published lessons complete or undo completion; the dashboard totals use those real records.

Profile bios and public profile photos are added by `supabase/migrations/202611200002_profile_bio_and_avatars.sql`. Apply it with `supabase db push` before using the expanded profile editor.

The academy display-name setting is added by `supabase/migrations/202611200003_academy_settings.sql`. Apply it with `supabase db push` before editing the academy name in Admin Settings.

## Import student accounts

The student workbook is kept under the ignored `private-imports/` folder, never under `public/`; that folder is excluded from Git and Vercel deployments. The importer validates locally by default and does not send anything to Supabase:

```powershell
python scripts/import_students.py
```

After applying the migration, set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` only in the local PowerShell session, then explicitly run the import:

```powershell
$env:SUPABASE_URL = "https://your-project.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "your-service-role-key"
python scripts/import_students.py --apply
```

The importer reads `NAME`, `SURNAME`, `CLASS`, `DOB`, `NUMBER`, `YEAR`, `GENDER`, `REG`, and `PASSWORD` from all workbook sheets. It creates confirmed Supabase Auth accounts with synthetic sign-in emails; students sign in with their **registration number and password**. Passwords are sent only to Supabase Auth, which stores password hashes. Accounts are required to choose a new password at first sign-in. Missing or shorter-than-six-character workbook passwords are replaced with random one-time passwords; those credentials are written only to `private-imports/generated-student-passwords.csv`. Keep that file private and securely delete it after distributing the credentials. Do not set Supabase's minimum password length above six until all imported temporary credentials have been used; the app requires at least eight characters for new or changed passwords.

## Roles

New self-registrations use an email address and receive the learner role. After the first administrator is set up, admins can create learner, instructor, and additional administrator accounts from **User management** in the dashboard. Admins can remove other accounts there; the last administrator and the current admin account are protected from deletion. Removing an account deletes its linked profile data and may be blocked when staff-owned records still reference it.

The initial administrator must be assigned by the project owner once, using the Supabase SQL editor:

```sql
update public.profiles
set role = 'instructor'
where username = 'instructor_username';
```

Use the `admin` role only for trusted academy administrators. The app does not let users choose or elevate their own role.

## Deploy to Vercel

`vercel.json` selects the Next.js framework, and `pnpm run build` runs `next build`. Import the project into Vercel or deploy with the Vercel CLI. Use Node.js 24 and pnpm 10.11.0, then configure these environment variables for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (the production app URL, recommended for canonical metadata)
- `SUPABASE_SERVICE_ROLE_KEY` (server-only; required for admins to create accounts from User management)

Apply Supabase migrations before using the deployed app. Never add secret keys under a `NEXT_PUBLIC_*` name or commit them. The private student workbook and generated credential report are excluded from deployment.

Automated account emails are currently paused. Admin-created accounts show a temporary password once in User Management for secure manual delivery. Supabase Auth verification and password-recovery emails remain configured separately in Supabase.
