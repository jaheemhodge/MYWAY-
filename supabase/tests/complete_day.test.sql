-- pgTAP test for complete_day() / get_progress() rules.
-- Run against a local stack:  supabase start && supabase test db
-- (or ./supabase/scripts/test-db.sh, which does both).
--
-- Everything runs inside one transaction and is rolled back at the end.
begin;

create extension if not exists pgtap;

select plan(22);

-- ---------------------------------------------------------------------------
-- Fixtures: two users. Inserting into auth.users fires the profile trigger.
-- ---------------------------------------------------------------------------
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'alice@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Alice"}', now(), now()),
  ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
   'bob@example.test', '', now(), '{"provider":"email","providers":["email"]}', '{"first_name":"Bob"}', now(), now());

select is(
  (select first_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Alice',
  'sign-up trigger creates the profile row with first_name'
);

-- Helper: act as a given user (what PostgREST does for an authenticated request).
create or replace function pg_temp.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

-- ---------------------------------------------------------------------------
-- Not onboarded yet
-- ---------------------------------------------------------------------------
select pg_temp.login('11111111-1111-1111-1111-111111111111');

select throws_ok(
  $$ select public.complete_day(1, '[]'::jsonb, null) $$,
  'P0001', 'NOT_ONBOARDED',
  'complete_day rejects a user who has not finished onboarding'
);

-- Finish onboarding (what profile.saveOnboarding does), through RLS as the user.
insert into public.questionnaire_responses (user_id, kind, answers)
values ('11111111-1111-1111-1111-111111111111', 'baseline', '{"q":"a"}');
update public.profiles
   set focus_area = 'knees', plan_start_date = current_date, onboarded_at = now()
 where id = '11111111-1111-1111-1111-111111111111';

select is(
  (select onboarded_at is not null from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  true,
  'user can update their own profile through RLS'
);

-- ---------------------------------------------------------------------------
-- Day order
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ select public.complete_day(2, '[]'::jsonb, null) $$,
  'P0001', 'DAY_LOCKED',
  'Day 2 is locked until Day 1 is done'
);

select throws_ok(
  $$ select public.complete_day(0, '[]'::jsonb, null) $$,
  '22023', 'INVALID_DAY',
  'Day 0 is rejected'
);

select throws_ok(
  $$ select public.complete_day(61, '[]'::jsonb, null) $$,
  '22023', 'INVALID_DAY',
  'Day 61 is rejected'
);

select throws_ok(
  $$ select public.complete_day(1, '[]'::jsonb, 9) $$,
  '22023', 'INVALID_FEELING',
  'feeling outside 1–5 is rejected'
);

select lives_ok(
  $$ select public.complete_day(1, '["K01","K02"]'::jsonb, 4) $$,
  'Day 1 can always be completed first'
);

select is(
  (public.get_progress() ->> 'current_day')::int, 2,
  'after Day 1, current_day is 2'
);

select throws_ok(
  $$ select public.complete_day(3, '[]'::jsonb, null) $$,
  'P0001', 'DAY_LOCKED',
  'skipping from Day 1 to Day 3 is rejected at the database'
);

select lives_ok(
  $$ select public.complete_day(2, '[]'::jsonb, null) $$,
  'Day 2 unlocks once Day 1 is done'
);

-- Replay: completing Day 1 again updates the row instead of duplicating it.
select lives_ok(
  $$ select public.complete_day(1, '["K01"]'::jsonb, null) $$,
  'replaying a finished day is allowed'
);

select is(
  (select count(*)::int from public.day_completions
    where user_id = '11111111-1111-1111-1111-111111111111' and day_number = 1),
  1,
  'replay does not duplicate the completion row'
);

select is(
  (select feeling from public.day_completions
    where user_id = '11111111-1111-1111-1111-111111111111' and day_number = 1),
  4,
  'replay without a feeling keeps the earlier feeling'
);

-- Direct writes are blocked: no insert policy on day_completions.
select throws_ok(
  $$ insert into public.day_completions (user_id, day_number)
     values ('11111111-1111-1111-1111-111111111111', 3) $$,
  '42501',
  null,
  'clients cannot insert completions directly'
);

-- ---------------------------------------------------------------------------
-- Re-check gates (fast-forward Alice to Day 29 as the owner role, bypassing RLS)
-- ---------------------------------------------------------------------------
reset role;
-- Days 4+ require full access. Set it as the owner, before the test logs in again.
update public.profiles
   set subscription_status = 'active'
 where id = '11111111-1111-1111-1111-111111111111';
insert into public.day_completions (user_id, day_number)
select '11111111-1111-1111-1111-111111111111', d from generate_series(3, 29) as d;
select pg_temp.login('11111111-1111-1111-1111-111111111111');

select is(
  public.get_progress() ->> 'recheck_due', 'day30',
  'get_progress flags the Day 30 re-check as due'
);

select throws_ok(
  $$ select public.complete_day(30, '[]'::jsonb, null) $$,
  'P0001', 'RECHECK_REQUIRED',
  'Day 30 is rejected until the day30 re-check exists'
);

insert into public.questionnaire_responses (user_id, kind, answers)
values ('11111111-1111-1111-1111-111111111111', 'day30', '{"q":"b"}');

select lives_ok(
  $$ select public.complete_day(30, '[]'::jsonb, null) $$,
  'Day 30 completes once the re-check is saved'
);

select is(
  public.get_progress() -> 'recheck_due', 'null'::jsonb,
  'no re-check due on Day 31'
);

-- Day 60 cap
reset role;
insert into public.day_completions (user_id, day_number)
select '11111111-1111-1111-1111-111111111111', d from generate_series(31, 59) as d;
insert into public.questionnaire_responses (user_id, kind, answers)
values ('11111111-1111-1111-1111-111111111111', 'day60', '{}');
select pg_temp.login('11111111-1111-1111-1111-111111111111');

select lives_ok(
  $$ select public.complete_day(60, '[]'::jsonb, 5) $$,
  'Day 60 completes with the day60 re-check present'
);

select is(
  (public.get_progress() ->> 'current_day')::int, 60,
  'current_day is capped at 60'
);

-- ---------------------------------------------------------------------------
-- Isolation: Bob sees none of Alice's rows
-- ---------------------------------------------------------------------------
select pg_temp.login('22222222-2222-2222-2222-222222222222');

select is(
  (select count(*)::int from public.day_completions), 0,
  'RLS hides other users'' completions'
);

select * from finish();
rollback;
