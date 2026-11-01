#!/usr/bin/env bash
# Runs the pgTAP tests in supabase/tests against a local Supabase stack.
#
#   ./supabase/scripts/test-db.sh            # start (if needed), reset migrations, run tests
#   KEEP_RUNNING=1 ./supabase/scripts/test-db.sh
#
# Needs the Supabase CLI (https://supabase.com/docs/guides/cli) and Docker.
set -euo pipefail

cd "$(dirname "$0")/../.."

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI not found. Install it: https://supabase.com/docs/guides/cli" >&2
  exit 1
fi

if ! supabase status >/dev/null 2>&1; then
  echo "Starting local Supabase..."
  supabase start
  STARTED=1
fi

echo "Applying migrations from scratch..."
supabase db reset

echo "Running pgTAP tests..."
supabase test db

if [[ "${STARTED:-}" == "1" && "${KEEP_RUNNING:-}" != "1" ]]; then
  supabase stop
fi
