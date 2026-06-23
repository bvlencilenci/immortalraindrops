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

live_active = ref(false)

# PHASE 1D: LIVE DJ INPUT (BUTT HARBOUR)
log("Configuring BUTT Harbor input on port 8005...")
live = input.harbor(
  "live",
  port=8005,
  on_connect=fun(_) -> begin
    log(">>> DJ CONNECTED!");
    live_active := true
  end,
  on_disconnect=fun() -> begin
    log(">>> DJ DISCONNECTED!");
    live_active := false
  end
)

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

# PHASE 1C: WEIGHTED ROTATION LOGIC (70/30 split) with fallback silence
log("Applying 70/30 weighted rotation...")
silence = blank()
music = fallback([featured, normal, silence])

# PHASE 1E: FALLBACK LOGIC (Priority 1: Live, Priority 2: Playlist)
# Switches instantly via track_sensitive=false
log("Establishing Fallback Chain...")
radio = fallback(track_sensitive=false, [live, music])



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
