# IMMORTAL RAINDROPS RADIO ENGINE
# ==========================================

# PHASE 1A: SYSTEM LOGGING
set("log.file", true)
set("log.file.path", "/var/log/liquidsoap/radio.log")
set("log.stdout", true)
set("log.level", 4) # Debug level for troubleshooting

log("=== IMMORTAL RAINDROPS RADIO ENGINE STARTING ===")

# Enable telnet server (exposed for Next.js command route via Fly private network / exposed port)
log("Enabling telnet server on bind address 0.0.0.0, port 7000...")
settings.server.telnet.set(true)
settings.server.telnet.bind_addr.set("0.0.0.0")
settings.server.telnet.port.set(7000)
log("Telnet server configuration loaded.")

# Environment variables
webhook_url = environment.get("LIVE_STATUS_WEBHOOK_URL")
webhook_secret = environment.get("LIVE_STATUS_WEBHOOK_SECRET")
icecast_host = environment.get("ICECAST_HOST")
icecast_host = if icecast_host != "" then icecast_host else "localhost" end
icecast_password = environment.get("ICECAST_SOURCE_PASSWORD")
harbor_env_password = environment.get("LIQUIDSOAP_HARBOR_PASSWORD")
harbor_password = if harbor_env_password != "" then harbor_env_password else icecast_password end

# Webhook notifications
def notify_status(is_live, title) =
  if webhook_url != "" and webhook_secret != "" then
    headers = [("Content-Type", "application/json"), ("X-Webhook-Secret", webhook_secret)]
    is_live_str = if is_live then "true" else "false" end
    
    # Escape double quotes in title
    safe_title = string.replace(pattern="\"", (fun (_) -> "\\\""), title)
    payload = '{"is_live":' ^ is_live_str ^ ',"stream_title":"' ^ safe_title ^ '"}'
    
    ignore(http.post(headers=headers, data=payload, webhook_url))
  end
end

live_active = ref(false)

# PHASE 1D: LIVE DJ INPUT (BUTT HARBOUR)
log("Configuring BUTT Harbor input on port 8005...")
settings.harbor.bind_addrs.set(["::"])

live = input.harbor(
  "live",
  port=8005,
  password=harbor_password,
  on_connect=fun(_) -> begin
    log(">>> DJ CONNECTED!");
    live_active := true;
    notify_status(true, "LIVE DJ SET")
  end,
  on_disconnect=fun() -> begin
    log(">>> DJ DISCONNECTED!");
    live_active := false;
    notify_status(true, "CURATED PLAYLIST")
  end
)

# PHASE 1B: PLAYLIST SOURCES
log("Configuring Unified Playlists from /music/unified...")

featured = playlist(
  id="featured",
  mode="randomize",
  reload_mode="watch",
  "/music/unified/featured"
)

normal = playlist(
  id="normal",
  mode="randomize",
  reload_mode="watch",
  "/music/unified/normal"
)

# PHASE 1C: STARTUP-RESILIENT PLAYLIST ROTATION
# playlists uses default track_sensitive=true — no mid-song cuts
# music uses track_sensitive=false — switches off silence immediately when playlists are ready
log("Applying playlist rotation with fallback...")
playlists = fallback(id="playlists", [featured, normal])
silence = blank(id="silence", duration=1.)
music = fallback(id="music", track_sensitive=false, [playlists, silence])

# Track-change listeners for debugging
source.on_track(featured, fun(m) -> begin
  title = if m["title"] != "" then m["title"] else "Unknown Title" end;
  artist = if m["artist"] != "" then m["artist"] else "Unknown Artist" end;
  log(">>> [FEATURED] Now playing: " ^ artist ^ " - " ^ title)
end)

source.on_track(normal, fun(m) -> begin
  title = if m["title"] != "" then m["title"] else "Unknown Title" end;
  artist = if m["artist"] != "" then m["artist"] else "Unknown Artist" end;
  log(">>> [NORMAL] Now playing: " ^ artist ^ " - " ^ title)
end)

radio = fallback(id="radio", track_sensitive=false, [live, music])

# Metadata handler for track advancement and live updates
def handle_metadata(m) =
  title = m["title"]
  artist = m["artist"]

  # Format the displayed track title
  display_title = if artist != "" and title != "" then
    artist ^ " - " ^ title
  elsif title != "" then
    title
  else
    "IMMORTAL RAINDROPS RADIO"
  end;

  log(">>> [METADATA] Track change: " ^ display_title);
  notify_status(true, display_title)
end

radio = source.on_metadata(radio, handle_metadata)

# ==========================================
# BROADCAST CONTROL: Custom server commands
# ==========================================

# Command: now_playing — returns current metadata
server.register(
  namespace="broadcast",
  description="Get current now-playing information",
  usage="now_playing",
  "now_playing",
  fun(_) -> begin
    is_live_str = if live_active() then "true" else "false" end;
    "is_live=" ^ is_live_str
  end
)

# Command: status — returns engine status
server.register(
  namespace="broadcast",
  description="Get engine status",
  usage="status",
  "status",
  fun(_) -> begin
    is_live_str = if live_active() then "LIVE" else "PLAYLIST" end;
    "mode=" ^ is_live_str
  end
)

# PHASE 1F: ICECAST OUTPUT
log("music source ready: " ^ source.id(music))
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

log("output connected to Icecast: mount=/radio")
log("=== RADIO ENGINE FULLY INITIALIZED ===")
