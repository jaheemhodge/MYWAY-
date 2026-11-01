-- Mobility core flow: profiles, questionnaires, day completions, favorites.
--
-- Rules enforced here (not only in the UI):
--   * every table has Row Level Security; a user only sees and writes their own rows
--   * day completions are written ONLY through complete_day(); there is no insert policy
--   * complete_day() rejects out-of-order days, Day 30/60 without the matching re-check,
--     and any call before onboarding is finished; replays of finished days are allowed
--   * get_progress() derives current day, phase and whether a re-check is due

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- profiles (one row per auth user, created by trigger on sign-up)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  age_range text,
  focus_area text check (focus_area in ('knees', 'lower_back', 'hips_balance')),
  plan_start_date date,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'One row per user. focus_area, plan_start_date and onboarded_at are set at the end of onboarding.';

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Auto-create the profile row when a user signs up. first_name comes from the
-- sign-up metadata (options.data.first_name in supabase-js).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name)
  values (new.id, nullif(trim(coalesce(new.raw_user_meta_data ->> 'first_name', '')), ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- questionnaire_responses (baseline at onboarding, re-checks on Day 30 / Day 60)
-- ---------------------------------------------------------------------------
create table if not exists public.questionnaire_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  kind text not null check (kind in ('baseline', 'day30', 'day60')),
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (user_id, kind)
);

alter table public.questionnaire_responses enable row level security;

drop policy if exists "questionnaires: read own" on public.questionnaire_responses;
create policy "questionnaires: read own"
  on public.questionnaire_responses for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "questionnaires: insert own" on public.questionnaire_responses;
create policy "questionnaires: insert own"
  on public.questionnaire_responses for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "questionnaires: update own" on public.questionnaire_responses;
create policy "questionnaires: update own"
  on public.questionnaire_responses for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- day_completions (read-only for clients; written by complete_day())
-- ---------------------------------------------------------------------------
create table if not exists public.day_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  day_number int not null check (day_number between 1 and 60),
  completed_at timestamptz not null default now(),
  exercises_done jsonb not null default '[]'::jsonb,
  feeling int check (feeling between 1 and 5),
  unique (user_id, day_number)
);

create index if not exists day_completions_user_day_idx
  on public.day_completions (user_id, day_number);

alter table public.day_completions enable row level security;

drop policy if exists "completions: read own" on public.day_completions;
create policy "completions: read own"
  on public.day_completions for select
  to authenticated
  using (user_id = auth.uid());
-- Intentionally no insert / update / delete policies: use complete_day().

-- ---------------------------------------------------------------------------
-- favorites (hearts)
-- ---------------------------------------------------------------------------
create table if not exists public.favorites (
  user_id uuid not null references auth.users (id) on delete cascade,
  exercise_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, exercise_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites: read own" on public.favorites;
create policy "favorites: read own"
  on public.favorites for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "favorites: insert own" on public.favorites;
create policy "favorites: insert own"
  on public.favorites for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "favorites: delete own" on public.favorites;
create policy "favorites: delete own"
  on public.favorites for delete
  to authenticated
  using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- complete_day(p_day, p_exercises, p_feeling)
--
-- Error messages are stable tokens the client maps to friendly copy:
--   NOT_AUTHENTICATED, NOT_ONBOARDED, INVALID_DAY, INVALID_FEELING,
--   INVALID_EXERCISES, DAY_LOCKED, RECHECK_REQUIRED
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

  -- Lock the profile row so two concurrent calls for the same user serialise.
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

  v_recheck_kind := case p_day when 30 then 'day30' when 60 then 'day60' else null end;
  if v_recheck_kind is not null and not exists (
    select 1 from public.questionnaire_responses
    where user_id = v_uid and kind = v_recheck_kind
  ) then
    raise exception 'RECHECK_REQUIRED' using errcode = 'P0001';
  end if;

  insert into public.day_completions (user_id, day_number, exercises_done, feeling)
  values (v_uid, p_day, p_exercises, p_feeling)
  on conflict (user_id, day_number) do update
    set completed_at = now(),
        exercises_done = excluded.exercises_done,
        feeling = coalesce(excluded.feeling, public.day_completions.feeling)
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.complete_day(int, jsonb, int) from public;
grant execute on function public.complete_day(int, jsonb, int) to authenticated;

-- ---------------------------------------------------------------------------
-- get_progress()
-- { current_day, completed_days, phase, recheck_due, all_done }
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
    'all_done', v_max >= 60
  );
end;
$$;

revoke all on function public.get_progress() from public;
grant execute on function public.get_progress() to authenticated;

-- Table grants (Supabase's default privileges usually cover these; explicit for clarity).
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.questionnaire_responses to authenticated;
grant select on public.day_completions to authenticated;
grant select, insert, delete on public.favorites to authenticated;
