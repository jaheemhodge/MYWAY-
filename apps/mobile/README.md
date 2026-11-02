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

Or paste each file in `supabase/migrations` into the dashboard **SQL Editor**, in filename order, and run it. `20261102000000_access_events.sql` adds profile email, sign-up method, subscription columns, the Days 1–3 gate, and `app_events`. Do not edit an old migration that has already been applied.

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
| `VITE_ENABLE_CHECKOUT` | `true` only after the Stripe test-mode steps below. Off, Days 4 to 60 say they open soon and show no price |

In Vercel: **Project → Settings → Environment Variables**, add the same client variables for the **Preview** environment (and Production when you are ready). Redeploy the preview afterwards; Vite reads env vars at build time. The server variables in the repo-root `.env.example` are separate and must not use the `VITE_` prefix.

### 4. Enable email + magic link sign-in

In the dashboard, **Authentication → Providers → Email**: keep **Enable email provider** on; **Confirm email** is your call (the sign-up screen handles both). Magic links use the same provider: nothing extra to switch on.

**Authentication → URL Configuration**: set **Site URL** to your app's origin (for example `https://your-preview.vercel.app`) and add redirect URLs for every origin you use:

```
http://localhost:5173/**
https://your-preview.vercel.app/**
http://localhost:5173/auth/callback
https://your-preview.vercel.app/auth/callback
```

Google, magic links and email confirmation return to `/auth/callback`. Password reset still returns to `/reset-password`. Add `https://<your-origin>/auth/callback` for every origin you use.

### 5. Optional: Google OAuth

1. In Google Cloud Console create an OAuth client (Web application). Authorised redirect URI: `https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback`.
2. In Supabase **Authentication → Providers → Google**, enable it and paste the client ID and secret.
3. Set `VITE_ENABLE_GOOGLE=true` locally and in Vercel to show the button. The button sends people to `<origin>/auth/callback` and asks Google to show the account chooser.

### 6. Free beta and full access

Days 1 to 3 are free. `complete_day()` raises `PAYWALL` for any later day, including a replay, unless `profiles.subscription_status` is `active`, `trialing` or `comped`. The screen is only a hint: files in `public/` (coach stills, Day 1 clips) are not access-controlled.

Full access is **$9.99 USD per month**, recurring. That price was not defined anywhere before this billing work. The Stripe Price is the source of truth; `STRIPE_PRICE_ID` selects it. The client label is `$9.99 / month`.

Checkout is **test mode only** until `STRIPE_TEST_MODE_ONLY` in `api/_lib/env.ts` is changed. A secret that does not start with `sk_test_` is refused.

### 7. Stripe test mode

Create a product and a recurring $9.99 USD / month Price in the Stripe dashboard, **test mode**. Copy the Price id (`price_...`).

Server variables (repo-root `.env.example`). Never prefix them with `VITE_` and never commit real values:

| Variable | Value |
| --- | --- |
| `STRIPE_SECRET_KEY` | `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | the `whsec_...` from `stripe listen` or the dashboard endpoint |
| `STRIPE_PRICE_ID` | the test Price id |
| `SUPABASE_URL` | same project URL as the client |
| `SUPABASE_SERVICE_ROLE_KEY` | service role key. Server only |
| `APP_URL` | optional. Public origin used for Checkout success and cancel URLs. Otherwise the request host is used |

From the repo root, with the [Stripe CLI](https://stripe.com/docs/stripe-cli) logged in:

```bash
npm install
vercel dev
# in another terminal
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

Put the printed `whsec_...` in `STRIPE_WEBHOOK_SECRET`. `npm run dev` inside `apps/mobile` does not serve `/api`. Test card `4242 4242 4242 4242`, any future date, any CVC.

A Vercel preview protected by Deployment Protection will not receive Stripe webhooks. Use an unprotected domain, or a Protection Bypass secret, if you want webhooks on a preview. That is a dashboard choice; this repo does not change it.

In Vercel, set the server variables on the project (Preview, and Production when you are ready). The functions live in `/api` because the Vercel root is the repo root.

### How the data model enforces the plan

- `profiles` is created by a trigger on sign-up; onboarding fills `focus_area`, `plan_start_date`, `onboarded_at`.
- Day completions are written **only** through `complete_day(p_day, p_exercises, p_feeling)`, which rejects
  a day unless the previous one is done, rejects Days 30/60 without the matching `questionnaire_responses`
  row, rejects anyone not onboarded, and updates (never duplicates) a replayed day.
- `get_progress()` returns `{ current_day, completed_days, phase, recheck_due, all_done, free_days_limit, has_full_access }`.
- `email`, `signup_method` and the subscription columns on `profiles` are not writable by the signed-in user. The sign-up trigger fills email and method. The Stripe webhook (service role) fills the subscription.
- Client `app_events` inserts are limited to `login` and `day_started`. `signup`, `onboarding_complete`, `day_completed`, `checkout_started`, `checkout_paid` and `subscription_canceled` are written by the database or the billing functions.
- The session player (`useSession` in `src/app/state/useSession.ts`, engine in `src/lib/session.ts`) is what
  calls `complete_day`. Each `p_exercises` entry is `{ id, status: "completed" | "skipped", setsDone }`
  (older rows may be bare id strings). An in-progress session lives only on this device
  (`localStorage` key `mobility.session.v1`: day, exercise index, set, exercises done) and is removed
  after a successful save. Optional sound cues default off (`mobility.session.cues.v1`).
- Every table has RLS: a user only reads and writes their own rows.
