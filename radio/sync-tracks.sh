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

TEMP_HTTP_CODE_SUB=$(mktemp)
SUBS_RESPONSE_FILE=$(mktemp)

curl -s -w "%{http_code}" -o "$SUBS_RESPONSE_FILE" -X GET "${SUPABASE_URL}/rest/v1/submissions?status=eq.approved&select=id,title,audio_url" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" > "$TEMP_HTTP_CODE_SUB"

HTTP_CODE_SUB=$(cat "$TEMP_HTTP_CODE_SUB")
SUBS_RESPONSE=$(cat "$SUBS_RESPONSE_FILE")
rm -f "$TEMP_HTTP_CODE_SUB" "$SUBS_RESPONSE_FILE"

echo "📡 Submissions API response status: $HTTP_CODE_SUB"
if [ "$HTTP_CODE_SUB" -ne 200 ]; then
  echo "❌ ERROR: Submissions API request failed with status $HTTP_CODE_SUB"
  echo "Response Body: $SUBS_RESPONSE"
  exit 1
fi

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
        echo "🔗 R2 URL: https://${R2_DOMAIN}/${audio_path}"
        if ! curl -s --fail --retry 3 --retry-delay 2 -o "$LOCAL_PATH" "https://${R2_DOMAIN}/${audio_path}"; then
          echo "⚠️ [submissions] Failed to download: $FILE_NAME — skipping"
          rm -f "$LOCAL_PATH"
        fi
      fi
    fi
  done
else
  echo "⚠️ Submissions fetch returned non-array response: $SUBS_RESPONSE"
fi

# ═══════════════════════════════════════════════════════════════════
# SOURCE 2: playlist_tracks (admin-uploaded radio rotation tracks)
# ═══════════════════════════════════════════════════════════════════
echo "📡 Syncing admin playlist tracks..."

TEMP_HTTP_CODE_PLAYLIST=$(mktemp)
PLAYLIST_RESPONSE_FILE=$(mktemp)

curl -s -w "%{http_code}" -o "$PLAYLIST_RESPONSE_FILE" -X GET "${SUPABASE_URL}/rest/v1/playlist_tracks?active=eq.true&select=id,title,audio_url,featured" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}" > "$TEMP_HTTP_CODE_PLAYLIST"

HTTP_CODE_PLAYLIST=$(cat "$TEMP_HTTP_CODE_PLAYLIST")
PLAYLIST_RESPONSE=$(cat "$PLAYLIST_RESPONSE_FILE")
rm -f "$TEMP_HTTP_CODE_PLAYLIST" "$PLAYLIST_RESPONSE_FILE"

echo "📡 Playlist tracks API response status: $HTTP_CODE_PLAYLIST"
if [ "$HTTP_CODE_PLAYLIST" -ne 200 ]; then
  echo "❌ ERROR: Playlist tracks API request failed with status $HTTP_CODE_PLAYLIST"
  echo "Response Body: $PLAYLIST_RESPONSE"
  exit 1
fi

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
        echo "🔗 R2 URL: https://${R2_DOMAIN}/${audio_path}"
        if ! curl -s --fail --retry 3 --retry-delay 2 -o "$LOCAL_PATH" "https://${R2_DOMAIN}/${audio_path}"; then
          echo "⚠️ [playlist] Failed to download: $FILE_NAME — skipping"
          rm -f "$LOCAL_PATH"
        fi
      fi
    fi
  done
else
  echo "⚠️ Playlist tracks fetch returned non-array response: $PLAYLIST_RESPONSE"
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
