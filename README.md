# Dzikaz Academy

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
| `profiles` | Supabase Auth user profile, unique username, academy role, and first-login password change flag. Supabase Auth handles passwords; they are never stored in this table. |
| `student_details` | Private registration number, class, date of birth, contact number, academic year, and gender imported from the workbook. Visible only to the student and administrators. |
| `subjects` | ZIMSEC subjects, level, syllabus code, and instructor. |
| `enrollments` | Learners enrolled in subjects. |
| `events` | Scheduled events, audience, and venue. |
| `notices` | Announcements and audience. |
| `marks` | Student assessment scores, maximum score, date, feedback, subject, and recording instructor. |
| `conversations` | Private learner/instructor conversation scoped to an enrolled subject. |
| `messages` | Messages and read status within a conversation. |

The migration creates the Auth profile trigger and role-based RLS policies. `supabase db push` requires the Supabase CLI; if needed, run `supabase init`, `supabase login`, and `supabase link --project-ref <project-ref>` first. Keep the existing migration file when initializing.

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

New self-registrations receive the learner role. Create/invite instructor or administrator accounts through Supabase Auth, then assign the profile role using the Supabase SQL editor as project owner:

```sql
update public.profiles
set role = 'instructor'
where username = 'instructor_username';
```

Use the `admin` role only for trusted academy administrators. The app does not let users choose or elevate their own role.

## Deploy to Vercel

`vercel.json` selects the Next.js framework and the existing Payload/Next build command. Import the project into Vercel or deploy with the Vercel CLI. Use Node.js 24 and pnpm 10.11.0, then configure these environment variables for Preview and Production:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (the production app URL, recommended for canonical metadata)

Apply the Supabase migration before using the deployed app. Never add the service-role key or the private student workbook to Vercel. The workbook and generated credential report are excluded from deployment.
