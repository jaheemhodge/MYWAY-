# Mobility iOS client

React + Vite + Capacitor. Design tokens and screens follow the supplied Claude Design file.

```bash
npm install
npm run dev
npm test
npm run build
npx cap sync
```

`VITE_API_URL` points at the FastAPI research server. If the API is down, the app still runs from the local program and safety engines.

## Accounts and progress (Supabase)

The logged-in app (`/app/*`) uses Supabase for auth and Postgres. Schema, Row Level Security and the
`complete_day()` / `get_progress()` functions live in [`/supabase/migrations`](../../supabase/migrations).
Logic is in `src/lib` (framework-agnostic) and React wiring in `src/app/state` (providers + hooks).

### 1. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**. Pick a region close to your users and save the database password somewhere safe.
2. In **Project Settings → API**, copy the **Project URL** and the **anon public** key. Never use the `service_role` key in the client.

### 2. Run the migrations

With the [Supabase CLI](https://supabase.com/docs/guides/cli) installed, from the repo root:

```bash
supabase login
supabase link --project-ref YOUR-PROJECT-REF
supabase db push            # applies supabase/migrations/*.sql
```

Or paste the contents of `supabase/migrations/20261101120000_core_flow.sql` into the dashboard **SQL Editor** and run it.

To work fully offline (Docker required):

```bash
supabase start              # local Postgres, Auth, Studio (http://localhost:54323) and mail catcher (http://localhost:54324)
supabase db reset           # re-applies every migration
supabase test db            # pgTAP tests in supabase/tests (or ./supabase/scripts/test-db.sh)
```

`supabase start` prints a local API URL and anon key you can use in `.env.local`.

### 3. Set the environment variables

Locally, copy `apps/mobile/.env.example` to `apps/mobile/.env.local` and fill in:

| Variable | Value |
| --- | --- |
| `VITE_SUPABASE_URL` | Project URL from step 1 |
| `VITE_SUPABASE_ANON_KEY` | anon public key from step 1 |
| `VITE_ENABLE_GOOGLE` | `true` only after step 5 |

In Vercel: **Project → Settings → Environment Variables**, add the same three for the **Preview** environment (and Production when you are ready). Redeploy the preview afterwards; Vite reads env vars at build time.

### 4. Enable email + magic link sign-in

In the dashboard, **Authentication → Providers → Email**: keep **Enable email provider** on; **Confirm email** is your call (the sign-up screen handles both). Magic links use the same provider: nothing extra to switch on.

**Authentication → URL Configuration**: set **Site URL** to your app's origin (for example `https://your-preview.vercel.app`) and add redirect URLs for every origin you use:

```
http://localhost:5173/**
https://your-preview.vercel.app/**
```

The app sends people back to `/login` after magic links and OAuth, and to `/reset-password` after a password reset.

### 5. Optional: Google OAuth

1. In Google Cloud Console create an OAuth client (Web application). Authorised redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`.
2. In Supabase **Authentication → Providers → Google**, enable it and paste the client ID and secret.
3. Set `VITE_ENABLE_GOOGLE=true` locally and in Vercel to show the button.

### How the data model enforces the plan

- `profiles` is created by a trigger on sign-up; onboarding fills `focus_area`, `plan_start_date`, `onboarded_at`.
- Day completions are written **only** through `complete_day(p_day, p_exercises, p_feeling)`, which rejects
  a day unless the previous one is done, rejects Days 30/60 without the matching `questionnaire_responses`
  row, rejects anyone not onboarded, and updates (never duplicates) a replayed day.
- `get_progress()` returns `{ current_day, completed_days, phase, recheck_due, all_done }`.
- The session player (`useSession` in `src/app/state/useSession.ts`, engine in `src/lib/session.ts`) is what
  calls `complete_day`. Each `p_exercises` entry is `{ id, status: "completed" | "skipped", setsDone }`
  (older rows may be bare id strings). An in-progress session lives only on this device
  (`localStorage` key `mobility.session.v1`: day, exercise index, set, exercises done) and is removed
  after a successful save. Optional sound cues default off (`mobility.session.cues.v1`).
- Every table has RLS: a user only reads and writes their own rows.
