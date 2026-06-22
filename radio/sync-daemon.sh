#!/bin/bash
set -e

echo "📡 Sync daemon started."

while true; do
  echo "⌛ Triggering sync-tracks.sh..."
  # Run from the radio directory to locate .env and playlist folders correctly
  cd /radio
  if ./sync-tracks.sh; then
    echo "✅ Sync completed successfully."
  else
    echo "⚠️ Sync execution encountered an error."
  fi
  echo "😴 Sleeping for 15 minutes..."
  sleep 900
done
