-- Tighten client events and stop signed-in users from probing has_full_access(other).
-- Does not edit 20261102000000_access_events.sql.

drop policy if exists "app_events: insert own client events" on public.app_events;
create policy "app_events: insert own client events"
  on public.app_events
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and event_name in ('login', 'day_started')
    and not (properties ? 'stripe_event_id')
    and pg_column_size(properties) < 4096
  );

-- complete_day and get_progress are SECURITY DEFINER and call this as the owner.
-- Signed-in users must not be able to pass someone else's id.
revoke all on function public.has_full_access(uuid) from public;
revoke all on function public.has_full_access(uuid) from anon, authenticated;
grant execute on function public.has_full_access(uuid) to current_user;
