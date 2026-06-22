#!/bin/bash
# sync-daemon.sh — Runs sync-tracks.sh on a loop every 15 minutes.
# NOTE: No 'set -e' — daemon must survive individual sync failures.

echo "📡 Sync daemon started."

while true; do
  echo "⌛ [$(date -u +%H:%M:%S)] Triggering sync-tracks.sh..."
  cd /radio
  if bash ./sync-tracks.sh; then
    echo "✅ [$(date -u +%H:%M:%S)] Sync completed successfully."
  else
    echo "⚠️ [$(date -u +%H:%M:%S)] Sync encountered an error — daemon will retry in 15 minutes."
  fi
  echo "😴 Sleeping for 15 minutes..."
  sleep 900
done
