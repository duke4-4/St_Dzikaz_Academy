# Dzikaz Academy

Next.js learning platform with Supabase Authentication and Postgres-backed learner marks and teacher/learner conversations. The initial Supabase database schema, constraints, and row-level security policies are in `supabase/migrations`.

## Run locally

1. Install Node.js 24.22.1 or later and pnpm.
2. Install dependencies with `pnpm install`.
3. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project's API settings.
4. Apply the migration below, then start the app with `pnpm dev`.

Only the Supabase project URL and publishable anon key belong in `.env.local`. Never expose a service-role key in a `NEXT_PUBLIC_*` variable or browser code.

## Set up Supabase

1. Create a Supabase project.
2. From the project root, authenticate and link the Supabase CLI to that project, then run `supabase db push`.
3. In Supabase Authentication settings, configure the site URL and allowed redirect URLs for the local and deployed app.
4. Enable email confirmation if required by your academy.
5. Add the project URL and publishable anon key to `.env.local`, then restart the Next.js server.

The migration creates:

| Table | Purpose |
| --- | --- |
| `profiles` | Academy username, display name, role, school, and contact details for each Supabase Auth account. Passwords are stored and verified by Supabase Auth, never in this table. |
| `subjects` | Subjects, syllabus codes, levels, and their instructor. |
| `enrollments` | Learner membership in subjects. |
| `events` | Scheduled academy events and audience. |
| `notices` | Academy announcements and audience. |
| `marks` | Assessment scores, maximum score, date, feedback, learner, subject, and recording instructor. |
| `conversations` | A private learner/instructor thread for an enrolled subject. |
| `messages` | Messages within a conversation, with sender, timestamp, and read status. |

Row-level security restricts profile visibility, subject and notice management, marks, and messages by role and relationship. The `on_auth_user_created` trigger creates a learner profile when a user signs up. A generated username is used only when an account is created without username metadata (for example, through the Supabase dashboard); users can change their username in `profiles`.

## Accounts and roles

Learners can register from the full-screen sign-in page with a username, name, email, and password. Sign-in uses Supabase Auth and the app loads the user's role from `profiles`; roles cannot be selected or changed in the client. Passwords are managed only by Supabase Auth.

Instructor and admin accounts should be created/invited by an authorized project administrator through Supabase Auth. To grant a role, use the Supabase SQL editor as the project owner:

```sql
update public.profiles
set role = 'instructor'
where username = 'instructor_username';
```

Use `admin` instead of `instructor` only for a trusted academy administrator. Do not expose the Supabase service-role key to the app.
