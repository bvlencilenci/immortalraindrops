# Log settings
set("log.file", true)
set("log.file.path", "/var/log/liquidsoap/radio.log")
set("log.stdout", true)
set("log.level", 3)

# Environment variables
webhook_url = os.getenv("LIVE_STATUS_WEBHOOK_URL")
webhook_secret = os.getenv("LIVE_STATUS_WEBHOOK_SECRET")
icecast_host = os.getenv("ICECAST_HOST")
icecast_password = os.getenv("ICECAST_SOURCE_PASSWORD")
harbor_env_password = os.getenv("LIQUIDSOAP_HARBOR_PASSWORD")
harbor_password = if harbor_env_password != "" then harbor_env_password else icecast_password end

# Configurable ratio: featured-to-general (default 60/40)
featured_weight = 60
general_weight = 40

# Playlist sources — reload via watch to pick up newly synced files instantly
featured_playlist = playlist(reload_mode="watch", "/music/playlist/featured")
general_playlist = playlist(reload_mode="watch", "/music/playlist/submissions")

# Combine via random.weighted and make safe (prevents crash if empty)
playlist = mksafe(random.weighted([
  (featured_weight, featured_playlist),
  (general_weight, general_playlist)
]))

# Harbor live input source
live = input.harbor(
  "live",
  port=8005,
  auth=fun(user, password) -> password == harbor_password
)

# Webhook notification function
def notify_status(is_live, title) =
  if webhook_url != "" and webhook_secret != "" then
    headers = [("Content-Type", "application/json"), ("X-Webhook-Secret", webhook_secret)]
    # Escape double quotes in title for safe JSON serialization
    escaped_title = string.escape(title)
    payload = '{"is_live":' ^ string_of(is_live) ^ ',"stream_title":"' ^ escaped_title ^ '"}'
    ignore(http.post(headers=headers, data=payload, webhook_url))
  end
end

# Track DJ live status
live_active = ref(false)

# Event callbacks when DJ connects/disconnects
def on_live_connect() =
  live_active.set(true)
  notify_status(true, "LIVE SET")
end

def on_live_disconnect() =
  live_active.set(false)
  notify_status(false, "PLAYLIST ROTATION")
end

# Register callbacks on live stream
live = on_start(on_live_connect, live)
live = on_stop(on_live_disconnect, live)

# Fallback chain: switch immediately when live harbor is active
radio = fallback(track_sensitive=false, [live, playlist])

# Metadata handler for track advancement and live updates
def handle_metadata(m) =
  title = m["title"]
  artist = m["artist"]
  filename = m["filename"]

  # Format the displayed track title
  display_title = if artist != "" and title != "" then
    artist ^ " - " ^ title
  elsif title != "" then
    title
  elsif filename != "" then
    # Fallback to filename (without path) if no tags present
    file.basename(filename)
  else
    "IMMORTAL RADIO"
  end

  # Determine actual live state from the reference variable
  is_live = !live_active
  notify_status(is_live, display_title)
end

# Listen to all metadata events on the final active stream
radio = on_metadata(handle_metadata, radio)

# Output to local Icecast instance
output.icecast(
  %mp3(bitrate=320),
  host=icecast_host,
  port=8000,
  password=icecast_password,
  mount="/radio",
  name="Immortal Raindrops Radio",
  description="Automated & Live Broadcasts",
  radio
)
