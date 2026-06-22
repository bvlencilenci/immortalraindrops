# IMMORTAL RAINDROPS RADIO ENGINE
# ==========================================

# PHASE 1A: SYSTEM LOGGING
set("log.file", true)
set("log.file.path", "/var/log/liquidsoap/radio.log")
set("log.stdout", true)
set("log.level", 4) # Debug level for troubleshooting

log("=== IMMORTAL RAINDROPS RADIO ENGINE STARTING ===")

# Environment variables
webhook_url = environment.get("LIVE_STATUS_WEBHOOK_URL")
webhook_secret = environment.get("LIVE_STATUS_WEBHOOK_SECRET")
icecast_host = environment.get("ICECAST_HOST")
icecast_host = if icecast_host != "" then icecast_host else "localhost" end
icecast_password = environment.get("ICECAST_SOURCE_PASSWORD")
harbor_env_password = environment.get("LIQUIDSOAP_HARBOR_PASSWORD")
harbor_password = if harbor_env_password != "" then harbor_env_password else icecast_password end

# PHASE 1B & PHASE 2(2/3): PLAYLIST SOURCES & FILE DECODING
log("Configuring Unified Playlists from /music/unified...")

featured = playlist(
  mode="random",
  reload_mode="watch",
  "/music/unified/featured"
)

normal = playlist(
  mode="random",
  reload_mode="watch",
  "/music/unified/normal"
)

# PHASE 2: Temporary debug logging
def log_featured(_) = log(">>> DEBUG: Featured source track selected!") end
def log_normal(_) = log(">>> DEBUG: Normal source track selected!") end

featured = on_track(log_featured, featured)
normal = on_track(log_normal, normal)

# PHASE 1C: WEIGHTED ROTATION LOGIC (70/30 split)
log("Applying 70/30 weighted rotation...")
music = random.weighted([
  (70, featured),
  (30, normal)
])

# PHASE 1D: LIVE DJ INPUT (BUTT HARBOUR)
log("Configuring BUTT Harbor input on port 8005...")
live = input.harbor(
  "live",
  port=8005,
  auth=fun(user, password) -> password == harbor_password
)

# Webhook UI Notifications
def notify_status(is_live, title) =
  if webhook_url != "" and webhook_secret != "" then
    headers = [("Content-Type", "application/json"), ("X-Webhook-Secret", webhook_secret)]
    is_live_str = if is_live then "true" else "false" end
    
    # Safely escape title for JSON (basic quote escaping)
    safe_title = string.replace(pattern="\"", (fun (_) -> "\\\""), title)
    payload = '{"is_live":' ^ is_live_str ^ ',"stream_title":"' ^ safe_title ^ '"}'
    
    ignore(http.post(headers=headers, data=payload, webhook_url))
  end
end

live_active = ref(false)
def on_live_connect() =
  log(">>> DJ CONNECTED! Initiating Override...")
  live_active.set(true)
  notify_status(true, "LIVE SET")
end

def on_live_disconnect() =
  log(">>> DJ DISCONNECTED! Falling back to rotation...")
  live_active.set(false)
  notify_status(false, "PLAYLIST ROTATION")
end

live = on_start(on_live_connect, live)
live = on_stop(on_live_disconnect, live)

# PHASE 1E: FALLBACK LOGIC (Priority 1: Live, Priority 2: Playlist)
# Switches instantly via track_sensitive=false
log("Establishing Fallback Chain...")
radio = fallback(track_sensitive=false, [live, music])

# Metadata handler for track info
def handle_metadata(m) =
  title = m["title"]
  artist = m["artist"]
  filename = m["filename"]

  display_title = if artist != "" and title != "" then
    artist ^ " - " ^ title
  elsif title != "" then
    title
  elsif filename != "" then
    file.basename(filename)
  else
    "IMMORTAL RADIO"
  end

  is_live = live_active()
  notify_status(is_live, display_title)
end

radio = on_metadata(handle_metadata, radio)

# PHASE 1F: ICECAST OUTPUT CONFIGURATION
log("Connecting output stream to Icecast on localhost:8000/radio...")
output.icecast(
  %mp3(bitrate=320),
  host="localhost",
  port=8000,
  password=icecast_password,
  mount="/radio",
  name="Immortal Raindrops Radio",
  description="Automated & Live Broadcasts",
  fallible=true,
  radio
)

log("=== RADIO ENGINE FULLY INITIALIZED ===")
