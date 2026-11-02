-- pgTAP: free-beta gate, subscription columns, and app_events.
-- Runs in one transaction and rolls back. Local stack only.
begin;

create extension if not exists pgtap;

select plan(31);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'maria@example.test', '', now(),
  '{"provider":"google","providers":["google"]}',
  '{"full_name":"Maria Lopez"}',
  now(), now()
);

select is(
  (select first_name from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'Maria',
  'Google sign-up takes the first word of full_name when first_name is missing'
);

select is(
  (select email from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'maria@example.test',
  'profile stores the auth email'
);

select is(
  (select signup_method from public.profiles where id = '33333333-3333-3333-3333-333333333333'),
  'google',
  'signup_method comes from app_metadata.provider'
);

select is(
  (select count(*)::int from public.app_events
    where user_id = '33333333-3333-3333-3333-333333333333' and event_name = 'signup'),
  1,
  'sign-up writes one signup event'
);

select is(
  (select properties ->> 'method' from public.app_events
    where user_id = '33333333-3333-3333-3333-333333333333' and event_name = 'signup'),
  'google',
  'signup event records the method'
);

-- A free user who has finished onboarding.
insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values (
  '44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
  'fred@example.test', '', now(),
  '{"provider":"email","providers":["email"]}',
  '{"first_name":"Fred"}',
  now(), now()
);

update public.profiles
   set focus_area = 'knees', plan_start_date = current_date, onboarded_at = now()
 where id = '44444444-4444-4444-4444-444444444444';

select is(
  (select count(*)::int from public.app_events
    where user_id = '44444444-4444-4444-4444-444444444444' and event_name = 'onboarding_complete'),
  1,
  'onboarding_complete is logged when onboarded_at is first set'
);

update public.profiles
   set first_name = 'Frederick'
 where id = '44444444-4444-4444-4444-444444444444';

select is(
  (select count(*)::int from public.app_events
    where user_id = '44444444-4444-4444-4444-444444444444' and event_name = 'onboarding_complete'),
  1,
  'a later profile edit does not log onboarding_complete again'
);

create or replace function pg_temp.login(p_uid uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, true);
  perform set_config('role', 'authenticated', true);
end;
$$;

select pg_temp.login('44444444-4444-4444-4444-444444444444');

select lives_ok($$ select public.complete_day(1, '[]'::jsonb, null) $$, 'a free user can complete Day 1');
select lives_ok($$ select public.complete_day(2, '[]'::jsonb, null) $$, 'a free user can complete Day 2');
select lives_ok($$ select public.complete_day(3, '[]'::jsonb, null) $$, 'a free user can complete Day 3');

select throws_ok(
  $$ select public.complete_day(4, '[]'::jsonb, null) $$,
  'P0001', 'PAYWALL',
  'Day 4 is refused for a free user'
);

select is((public.get_progress() ->> 'free_days_limit')::int, 3, 'get_progress reports free_days_limit 3');
select is((public.get_progress() ->> 'has_full_access')::boolean, false, 'a free user does not have full access');

select throws_ok(
  $$ update public.profiles set subscription_status = 'active' where id = '44444444-4444-4444-4444-444444444444' $$,
  '42501', null,
  'an authenticated user cannot set subscription_status'
);

select throws_ok(
  $$ update public.profiles set stripe_customer_id = 'cus_test' where id = '44444444-4444-4444-4444-444444444444' $$,
  '42501', null,
  'an authenticated user cannot set stripe_customer_id'
);

select lives_ok(
  $$ insert into public.app_events (user_id, event_name, properties)
     values ('44444444-4444-4444-4444-444444444444', 'login', '{"via":"password"}') $$,
  'a client can insert their own login event'
);

select throws_ok(
  $$ insert into public.app_events (user_id, event_name)
     values ('33333333-3333-3333-3333-333333333333', 'login') $$,
  '42501', null,
  'a client cannot insert an event for someone else'
);

select throws_ok(
  $$ insert into public.app_events (user_id, event_name)
     values ('44444444-4444-4444-4444-444444444444', 'checkout_paid') $$,
  '42501', null,
  'a client cannot insert checkout_paid'
);

reset role;
update public.profiles set subscription_status = 'active' where id = '44444444-4444-4444-4444-444444444444';
select pg_temp.login('44444444-4444-4444-4444-444444444444');

select lives_ok($$ select public.complete_day(4, '[]'::jsonb, null) $$, 'an active subscription can complete Day 4');
select is((public.get_progress() ->> 'has_full_access')::boolean, true, 'active has full access');

reset role;
update public.profiles set subscription_status = 'canceled' where id = '44444444-4444-4444-4444-444444444444';
select pg_temp.login('44444444-4444-4444-4444-444444444444');
select throws_ok(
  $$ select public.complete_day(5, '[]'::jsonb, null) $$,
  'P0001', 'PAYWALL',
  'canceled does not unlock Day 5'
);

reset role;
update public.profiles set subscription_status = 'past_due' where id = '44444444-4444-4444-4444-444444444444';
select pg_temp.login('44444444-4444-4444-4444-444444444444');
select throws_ok(
  $$ select public.complete_day(5, '[]'::jsonb, null) $$,
  'P0001', 'PAYWALL',
  'past_due does not unlock Day 5'
);

reset role;
update public.profiles set subscription_status = 'comped' where id = '44444444-4444-4444-4444-444444444444';
select pg_temp.login('44444444-4444-4444-4444-444444444444');
select lives_ok($$ select public.complete_day(5, '[]'::jsonb, null) $$, 'comped can complete Day 5');

reset role;
update public.profiles set subscription_status = 'trialing' where id = '44444444-4444-4444-4444-444444444444';
select pg_temp.login('44444444-4444-4444-4444-444444444444');
select lives_ok($$ select public.complete_day(5, '[]'::jsonb, null) $$, 'trialing can replay a day past the free limit');

-- PostgREST upsert is INSERT ... ON CONFLICT DO UPDATE SET id = excluded.id.
-- The update grant does not include id, so that statement is permission denied.
select lives_ok(
  $$ update public.profiles
     set focus_area = 'knees', plan_start_date = current_date, onboarded_at = now()
     where id = auth.uid() $$,
  'authenticated can save onboarding columns'
);

select throws_ok(
  $$ insert into public.profiles (id, focus_area)
     values (auth.uid(), 'knees')
     on conflict (id) do update set id = excluded.id $$,
  '42501', null,
  'upsert that sets id is denied'
);

select throws_ok(
  $$ update public.profiles set email = 'other@example.test' where id = auth.uid() $$,
  '42501', null,
  'an authenticated user cannot set email'
);

select throws_ok(
  $$ update public.profiles set signup_method = 'google' where id = auth.uid() $$,
  '42501', null,
  'an authenticated user cannot set signup_method'
);

select throws_ok(
  $$ insert into public.app_events (user_id, event_name, properties)
     values (auth.uid(), 'login', '{"stripe_event_id":"evt_client"}') $$,
  '42501', null,
  'a client cannot attach a stripe_event_id'
);

select throws_ok(
  $$ insert into public.app_events (user_id, event_name, properties)
     values (auth.uid(), 'day_started', jsonb_build_object('blob', repeat('x', 5000))) $$,
  '42501', null,
  'a client cannot store a huge properties object'
);

select throws_ok(
  $$ select public.has_full_access('33333333-3333-3333-3333-333333333333') $$,
  '42501', null,
  'a signed-in user cannot probe another user'
);

select * from finish();
rollback;
