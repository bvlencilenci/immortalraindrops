#!/bin/bash
set -e

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | xargs)
fi

# Configuration
SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"
R2_DOMAIN="${NEXT_PUBLIC_R2_PUBLIC_DOMAIN:-pub-83e39df2389c4bef95c442c0e0c6a8ad.r2.dev}"
PLAYLIST_DIR="${PLAYLIST_DIR:-./playlist}"

# Ensure directories exist
mkdir -p "${PLAYLIST_DIR}/featured"
mkdir -p "${PLAYLIST_DIR}/submissions"

TEMP_FEATURED=$(mktemp)
TEMP_SUBMISSIONS=$(mktemp)

# ═══════════════════════════════════════════════════════════════════
# SOURCE 1: submissions (approved tracks from public submission flow)
# ═══════════════════════════════════════════════════════════════════
echo "📡 Syncing approved submissions..."

SUBS_RESPONSE=$(curl -s -X GET "${SUPABASE_URL}/rest/v1/submissions?status=eq.approved&select=id,title,audio_url,featured" \
  -H "apikey: ${SUPABASE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_KEY}")

if echo "$SUBS_RESPONSE" | grep -q '^\['; then
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
" <<< "$SUBS_RESPONSE" | while read -r audio_path is_featured; do
    if [ -n "$audio_path" ]; then
      FILE_NAME=$(basename "$audio_path")

      if [ "$is_featured" = "true" ]; then
        LOCAL_PATH="${PLAYLIST_DIR}/featured/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_FEATURED"
        rm -f "${PLAYLIST_DIR}/submissions/${FILE_NAME}"
      else
        LOCAL_PATH="${PLAYLIST_DIR}/submissions/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_SUBMISSIONS"
        rm -f "${PLAYLIST_DIR}/featured/${FILE_NAME}"
      fi

      if [ ! -f "$LOCAL_PATH" ]; then
        echo "📥 [submissions] Downloading: $FILE_NAME"
        curl -s -o "$LOCAL_PATH" "https://${R2_DOMAIN}/${audio_path}"
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
        LOCAL_PATH="${PLAYLIST_DIR}/featured/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_FEATURED"
        rm -f "${PLAYLIST_DIR}/submissions/${FILE_NAME}"
      else
        LOCAL_PATH="${PLAYLIST_DIR}/submissions/${FILE_NAME}"
        echo "$FILE_NAME" >> "$TEMP_SUBMISSIONS"
        rm -f "${PLAYLIST_DIR}/featured/${FILE_NAME}"
      fi

      if [ ! -f "$LOCAL_PATH" ]; then
        echo "📥 [playlist] Downloading: $FILE_NAME"
        curl -s -o "$LOCAL_PATH" "https://${R2_DOMAIN}/${audio_path}"
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

find "${PLAYLIST_DIR}/featured" -type f 2>/dev/null | while read -r local_file; do
  FILE_NAME=$(basename "$local_file")
  if ! grep -q "^${FILE_NAME}$" "$TEMP_FEATURED" 2>/dev/null; then
    echo "🗑 Removing stale featured: $FILE_NAME"
    rm "$local_file"
  fi
done

find "${PLAYLIST_DIR}/submissions" -type f 2>/dev/null | while read -r local_file; do
  FILE_NAME=$(basename "$local_file")
  if ! grep -q "^${FILE_NAME}$" "$TEMP_SUBMISSIONS" 2>/dev/null; then
    echo "🗑 Removing stale submission: $FILE_NAME"
    rm "$local_file"
  fi
done

rm -f "$TEMP_FEATURED"
rm -f "$TEMP_SUBMISSIONS"

# Ensure liquidsoap user has correct ownership/permissions on downloaded tracks
if [ -d "${PLAYLIST_DIR}" ]; then
  chown -R liquidsoap:liquidsoap "${PLAYLIST_DIR}" 2>/dev/null || true
  chmod -R 775 "${PLAYLIST_DIR}" 2>/dev/null || true
fi

echo "✅ Radio rotation synchronized successfully."
