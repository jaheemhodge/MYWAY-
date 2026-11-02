-- Access, subscriptions and app_events.
--
-- Adds the columns and functions the free beta (Days 1–3) and Stripe checkout need.
-- Idempotent: safe to re-run. Does not edit 20261101120000_core_flow.sql.
--
-- Money columns (subscription_status, stripe_*, subscription_current_period_end) are not
-- writable by signed-in users. The service role and security-definer functions write them.
-- email and signup_method are written by handle_new_user() only.

-- ---------------------------------------------------------------------------
-- profiles: identity + subscription columns
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists signup_method text;
alter table public.profiles add column if not exists subscription_status text not null default 'none';
alter table public.profiles add column if not exists stripe_customer_id text;
alter table public.profiles add column if not exists stripe_subscription_id text;
alter table public.profiles add column if not exists subscription_current_period_end timestamptz;

alter table public.profiles drop constraint if exists profiles_subscription_status_check;
alter table public.profiles add constraint profiles_subscription_status_check
  check (subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled', 'comped'));

create unique index if not exists profiles_stripe_customer_id_key
  on public.profiles (stripe_customer_id);

-- ---------------------------------------------------------------------------
-- app_events (not "events": that name is the local-events feature in the UI)
-- ---------------------------------------------------------------------------
create table if not exists public.app_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  event_name text not null check (event_name in (
    'signup', 'login', 'onboarding_complete', 'day_started', 'day_completed',
    'checkout_started', 'checkout_paid', 'subscription_canceled'
  )),
  properties jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists app_events_user_created_idx on public.app_events (user_id, created_at);
create index if not exists app_events_name_created_idx on public.app_events (event_name, created_at);
create unique index if not exists app_events_stripe_event_id_idx
  on public.app_events ((properties ->> 'stripe_event_id'))
  where properties ? 'stripe_event_id';

alter table public.app_events enable row level security;

revoke all on public.app_events from anon, authenticated;
grant insert on public.app_events to authenticated;

drop policy if exists "app_events: insert own client events" on public.app_events;
create policy "app_events: insert own client events"
  on public.app_events for insert
  to authenticated
  with check (user_id = auth.uid() and event_name in ('login', 'day_started'));

-- ---------------------------------------------------------------------------
-- Sign-up trigger: name, email, method, signup event
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_first text;
  v_method text := coalesce(new.raw_app_meta_data ->> 'provider', 'email');
begin
  v_first := nullif(trim(coalesce(v_meta ->> 'first_name', '')), '');
  if v_first is null then
    v_first := nullif(trim(coalesce(v_meta ->> 'given_name', '')), '');
  end if;
  if v_first is null then
    v_first := nullif(split_part(trim(coalesce(v_meta ->> 'full_name', '')), ' ', 1), '');
  end if;
  if v_first is null then
    v_first := nullif(split_part(trim(coalesce(v_meta ->> 'name', '')), ' ', 1), '');
  end if;

  insert into public.profiles (id, first_name, email, signup_method)
  values (new.id, v_first, new.email, v_method)
  on conflict (id) do nothing;

  insert into public.app_events (user_id, event_name, properties)
  values (new.id, 'signup', jsonb_build_object('method', v_method));

  return new;
end;
$$;

-- Every auth user has a profile. Fill email / method on rows the old trigger created.
insert into public.profiles (id, first_name, email, signup_method)
select
  u.id,
  nullif(trim(coalesce(u.raw_user_meta_data ->> 'first_name', '')), ''),
  u.email,
  coalesce(u.raw_app_meta_data ->> 'provider', 'email')
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

update public.profiles p
set
  email = coalesce(p.email, u.email),
  signup_method = coalesce(p.signup_method, u.raw_app_meta_data ->> 'provider', 'email')
from auth.users u
where p.id = u.id
  and (p.email is distinct from u.email or p.signup_method is null);

-- ---------------------------------------------------------------------------
-- Clients cannot write money columns (or email / signup_method)
-- ---------------------------------------------------------------------------
revoke insert, update on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, first_name, age_range, focus_area, plan_start_date, onboarded_at)
  on public.profiles to authenticated;
grant update (first_name, age_range, focus_area, plan_start_date, onboarded_at)
  on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Free-beta limit. Full access is active, trialing or comped.
-- ---------------------------------------------------------------------------
create or replace function public.free_days_limit()
returns int
language sql
immutable
as 'select 3';

create or replace function public.has_full_access(p_uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_uid
      and subscription_status in ('active', 'trialing', 'comped')
  );
$$;

revoke all on function public.free_days_limit() from public;
revoke all on function public.has_full_access(uuid) from public;
grant execute on function public.free_days_limit() to authenticated;
grant execute on function public.has_full_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- complete_day: same checks, then the paywall, then a day_completed event.
-- The paywall applies to replays as well as first completions.
-- ---------------------------------------------------------------------------
create or replace function public.complete_day(
  p_day int,
  p_exercises jsonb default '[]'::jsonb,
  p_feeling int default null
)
returns public.day_completions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile public.profiles%rowtype;
  v_recheck_kind text;
  v_row public.day_completions%rowtype;
  v_replay boolean;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  if p_day is null or p_day < 1 or p_day > 60 then
    raise exception 'INVALID_DAY' using errcode = '22023';
  end if;

  if p_feeling is not null and (p_feeling < 1 or p_feeling > 5) then
    raise exception 'INVALID_FEELING' using errcode = '22023';
  end if;

  if p_exercises is null or jsonb_typeof(p_exercises) <> 'array' then
    raise exception 'INVALID_EXERCISES' using errcode = '22023';
  end if;

  select * into v_profile
  from public.profiles
  where id = v_uid
  for update;

  if not found or v_profile.onboarded_at is null then
    raise exception 'NOT_ONBOARDED' using errcode = 'P0001';
  end if;

  if p_day > 1 and not exists (
    select 1 from public.day_completions
    where user_id = v_uid and day_number = p_day - 1
  ) then
    raise exception 'DAY_LOCKED' using errcode = 'P0001';
  end if;

  if p_day > public.free_days_limit() and not public.has_full_access(v_uid) then
    raise exception 'PAYWALL' using errcode = 'P0001';
  end if;

  v_recheck_kind := case p_day when 30 then 'day30' when 60 then 'day60' else null end;
  if v_recheck_kind is not null and not exists (
    select 1 from public.questionnaire_responses
    where user_id = v_uid and kind = v_recheck_kind
  ) then
    raise exception 'RECHECK_REQUIRED' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from public.day_completions
    where user_id = v_uid and day_number = p_day
  ) into v_replay;

  insert into public.day_completions (user_id, day_number, exercises_done, feeling)
  values (v_uid, p_day, p_exercises, p_feeling)
  on conflict (user_id, day_number) do update
    set completed_at = now(),
        exercises_done = excluded.exercises_done,
        feeling = coalesce(excluded.feeling, public.day_completions.feeling)
  returning * into v_row;

  insert into public.app_events (user_id, event_name, properties)
  values (v_uid, 'day_completed', jsonb_build_object('day', p_day, 'replay', v_replay));

  return v_row;
end;
$$;

-- ---------------------------------------------------------------------------
-- get_progress: existing keys plus free_days_limit and has_full_access
-- ---------------------------------------------------------------------------
create or replace function public.get_progress()
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_max int;
  v_days int[];
  v_current int;
  v_phase int;
  v_recheck text;
begin
  if v_uid is null then
    raise exception 'NOT_AUTHENTICATED' using errcode = '42501';
  end if;

  select coalesce(max(day_number), 0),
         coalesce(array_agg(day_number order by day_number), '{}'::int[])
    into v_max, v_days
  from public.day_completions
  where user_id = v_uid;

  v_current := least(v_max + 1, 60);
  v_phase := case when v_current <= 20 then 1 when v_current <= 40 then 2 else 3 end;

  v_recheck := case
    when v_current = 30 and not exists (
      select 1 from public.questionnaire_responses where user_id = v_uid and kind = 'day30'
    ) then 'day30'
    when v_current = 60 and v_max < 60 and not exists (
      select 1 from public.questionnaire_responses where user_id = v_uid and kind = 'day60'
    ) then 'day60'
    else null
  end;

  return jsonb_build_object(
    'current_day', v_current,
    'completed_days', to_jsonb(v_days),
    'phase', v_phase,
    'recheck_due', v_recheck,
    'all_done', v_max >= 60,
    'free_days_limit', public.free_days_limit(),
    'has_full_access', public.has_full_access(v_uid)
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- onboarding_complete, once, when onboarded_at is first set
-- ---------------------------------------------------------------------------
create or replace function public.log_onboarding_complete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.onboarded_at is null and new.onboarded_at is not null then
    insert into public.app_events (user_id, event_name, properties)
    values (new.id, 'onboarding_complete', jsonb_build_object('focus_area', new.focus_area));
  end if;
  return new;
end;
$$;

drop trigger if exists on_profile_onboarded on public.profiles;
create trigger on_profile_onboarded
  after update on public.profiles
  for each row execute function public.log_onboarding_complete();
