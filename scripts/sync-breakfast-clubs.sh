#!/bin/bash
#
# Auto-sync the desktop Breakfast Club folder → Supabase.
#
# Runs the idempotent import (scripts/import-breakfast-clubs.ts --apply), which
# creates any new breakfast_club sessions and uploads their PDFs. Because the
# website reads Supabase live, newly-added clubs show up on the rolling calendar
# with no redeploy. Dedupe-by-date means re-running only adds what's new.
#
# Invoked by the launchd agent com.ohsu.trauma.breakfast-sync (on folder change
# and on a timer). Safe to run by hand too: `scripts/sync-breakfast-clubs.sh`.
set -euo pipefail

# launchd starts jobs with a bare PATH — make node/npm reachable.
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin"

PROJECT_DIR="/Users/dekeyser/Desktop/Trauma-Didactics-App-2"
SOURCE_ROOT="${BREAKFAST_CLUB_ROOT:-/Users/dekeyser/Desktop/OHSU Trauma/Breakfast Club}"
LOG="$HOME/Library/Logs/breakfast-club-sync.log"

cd "$PROJECT_DIR"

{
  echo "===== $(date '+%Y-%m-%d %H:%M:%S') sync start ($SOURCE_ROOT) ====="
  if [ ! -d "$SOURCE_ROOT" ]; then
    echo "  [error] source folder not found — skipping"
  else
    npm run --silent import:breakfast-clubs:apply "$SOURCE_ROOT"
  fi
  echo "===== $(date '+%Y-%m-%d %H:%M:%S') sync done ====="
  echo
} >> "$LOG" 2>&1
