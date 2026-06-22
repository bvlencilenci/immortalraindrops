#!/bin/bash
# sync-tracks.sh — Downloads active tracks from Supabase/R2 into /music/playlist
# NOTE: No 'set -e' — individual failures should not abort the entire sync.

# Load environment variables from .env if present (local dev only)
if [ -f .env ]; then
  set -a; source .env; set +a
fi

# Configuration
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL:-https://ajbkuiyhpoiuezsittpy.supabase.co}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY:-$SUPABASE_KEY}"
R2_DOMAIN="${NEXT_PUBLIC_R2_PUBLIC_DOMAIN:-pub-83e39df2389c4bef95c442c0e0c6a8ad.r2.dev}"
UNIFIED_DIR="${UNIFIED_DIR:-/music/unified}"

if [ -z "$SUPABASE_KEY" ]; then
  echo "❌ FATAL: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY is missing from environment! Sync aborted."
  exit 1
fi

# Ensure directories exist
mkdir -p "${UNIFIED_DIR}/featured"
mkdir -p "${UNIFIED_DIR}/normal"

TEMP_FEATURED=$(mktemp)
TEMP_SUBMISSIONS=$(mktemp)

# ═══════════════════════════════════════════════════════════════════
# SOURCE 1: submissions (approved tracks from public submission flow)
# ═══════════════════════════════════════════════════════════════════
echo "📡 Syncing approved submissions..."

SUBS_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/submissions?status=eq.approved&select=id,title,audio_url" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if echo "$SUBS_RESPONSE" | grep -q '^\['; then
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for track in data:
        url = track.get('audio_url')
        feat = 'false'
        if url:
            print(f'{url} {feat}')
except Exception:
    pass
" <<< "$SUBS_RESPONSE" | while read -r audio_path is_featured; do
    if [ -n "$audio_path" ]; then
      FILE_NAME=$(basename "$audio_path")

      if [ "$is_featured" = "true" ]; then
        LOCAL_PATH="${UNIFIED_DIR}/featured/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_FEATURED"
        rm -f "${UNIFIED_DIR}/normal/${FILE_NAME}"
      else
        LOCAL_PATH="${UNIFIED_DIR}/normal/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_SUBMISSIONS"
        rm -f "${UNIFIED_DIR}/featured/${FILE_NAME}"
      fi

      if [ ! -f "$LOCAL_PATH" ]; then
        echo "📥 [submissions] Downloading: $FILE_NAME"
        if ! curl -s --fail --retry 3 --retry-delay 2 -o "$LOCAL_PATH" "https://${R2_DOMAIN}/${audio_path}"; then
          echo "⚠️ [submissions] Failed to download: $FILE_NAME — skipping"
          rm -f "$LOCAL_PATH"
        fi
      fi
    fi
  done
else
  echo "⚠️ Submissions fetch returned non-array response (may be empty): $SUBS_RESPONSE"
fi

# ═══════════════════════════════════════════════════════════════════
# SOURCE 2: playlist_tracks (admin-uploaded radio rotation tracks)
# ═══════════════════════════════════════════════════════════════════
echo "📡 Syncing admin playlist tracks..."

PLAYLIST_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/playlist_tracks?active=eq.true&select=id,title,audio_url,featured" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if echo "$PLAYLIST_RESPONSE" | grep -q '^\['; then
  python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for track in data:
        url = track.get('audio_url')
        feat = 'true' if track.get('featured') else 'false'
        if url:
            print(f'{url} {feat}')
except Exception:
    pass
" <<< "$PLAYLIST_RESPONSE" | while read -r audio_path is_featured; do
    if [ -n "$audio_path" ]; then
      FILE_NAME=$(basename "$audio_path")

      if [ "$is_featured" = "true" ]; then
        LOCAL_PATH="${UNIFIED_DIR}/featured/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_FEATURED"
        rm -f "${UNIFIED_DIR}/normal/${FILE_NAME}"
      else
        LOCAL_PATH="${UNIFIED_DIR}/normal/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_SUBMISSIONS"
        rm -f "${UNIFIED_DIR}/featured/${FILE_NAME}"
      fi

      if [ ! -f "$LOCAL_PATH" ]; then
        echo "📥 [playlist] Downloading: $FILE_NAME"
        if ! curl -s --fail --retry 3 --retry-delay 2 -o "$LOCAL_PATH" "https://${R2_DOMAIN}/${audio_path}"; then
          echo "⚠️ [playlist] Failed to download: $FILE_NAME — skipping"
          rm -f "$LOCAL_PATH"
        fi
      fi
    fi
  done
else
  echo "⚠️ Playlist tracks fetch returned non-array response (may be empty): $PLAYLIST_RESPONSE"
fi

# ═══════════════════════════════════════════════════════════════════
# CLEANUP: Remove local files no longer in either source
# ═══════════════════════════════════════════════════════════════════
echo "🧹 Cleaning stale files..."

find "${UNIFIED_DIR}/featured" -type f 2>/dev/null | while read -r local_file; do
  FILE_NAME=$(basename "$local_file")
  if ! grep -q "^${FILE_NAME}$" "$TEMP_FEATURED" 2>/dev/null; then
    echo "🗑 Removing stale featured: $FILE_NAME"
    rm "$local_file"
  fi
done

find "${UNIFIED_DIR}/normal" -type f 2>/dev/null | while read -r local_file; do
  FILE_NAME=$(basename "$local_file")
  if ! grep -q "^${FILE_NAME}$" "$TEMP_SUBMISSIONS" 2>/dev/null; then
    echo "🗑 Removing stale submission: $FILE_NAME"
    rm "$local_file"
  fi
done

rm -f "$TEMP_FEATURED"
rm -f "$TEMP_SUBMISSIONS"

# Ensure liquidsoap user has correct ownership/permissions on downloaded tracks
if [ -d "${UNIFIED_DIR}" ]; then
  chown -R liquidsoap:liquidsoap "${UNIFIED_DIR}" 2>/dev/null || true
  chmod -R 775 "${UNIFIED_DIR}" 2>/dev/null || true
fi

echo "✅ Radio rotation synchronized successfully."
