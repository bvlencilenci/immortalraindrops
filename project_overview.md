# PROJECT ARCHITECTURE OVERVIEW: IMMORTAL RAINDROPS AUDIO-ONLY RADIO MIGRATION

This document provides a complete, detailed, and production-ready reference of the **Immortal Raindrops** platform migration from legacy Owncast/HLS video streaming to a custom, containerized, audio-only Icecast/Liquidsoap radio infrastructure.

---

## 1. System Architecture

```mermaid
graph TD
    %% Audio Sources
    subgraph DJ Broadcaster
        BUTT[BUTT/Desktop Client]
    end

    subgraph Supabase & Storage
        DB[(Supabase PostgreSQL)]
        R2[Cloudflare R2 Bucket]
    end

    %% Containerized Stack
    subgraph VPS/Fly.io Container Stack (/radio)
        Nginx[Nginx Reverse Proxy]
        Liquidsoap[Liquidsoap Engine]
        Icecast[Icecast Server]
        SyncScript[sync-tracks.sh]
    end

    %% Frontend App
    subgraph Next.js Web App
        Layout[Root Layout]
        RadioPlayer[RadioPlayer Component]
        LiveBroadcast[LiveBroadcast UI /live]
        WebhookAPI[Live-Status API Webhook]
    end

    %% Connections
    BUTT -->|Icecast/Harbor Protocol: Port 8005| Liquidsoap
    SyncScript -->|Fetch Database & Download Assets| DB & R2
    SyncScript -->|Populate playlist/featured & playlist/submissions| Liquidsoap
    Liquidsoap -->|Local Source Stream| Icecast
    Nginx -->|SSL Termination & Proxy| Icecast
    Icecast -->|Local stream to Nginx| Nginx
    Nginx -->|Secure Mount: https://radio.immortalraindrops.art/radio| RadioPlayer
    Liquidsoap -->|On-Connect/Disconnect/Metadata Webhooks| WebhookAPI
    WebhookAPI -->|Update is_live & now_playing| DB
    LiveBroadcast -->|Real-time Subscription| DB
```

---

## 2. Infrastructure & Container Config (`/radio`)

The radio stack is fully containerized and designed to run on a separate VPS or alongside the main app.

### A. Docker Orchestration (`radio/docker-compose.yml`)
Provisions three lightweight alpine-based containers sharing local storage volumes:
- **Nginx (`nginx`):** Handles HTTPS SSL termination and reverse proxies the stream. Port `80` and `443` are exposed.
- **Icecast2 (`icecast`):** Serves the audio stream. Internal port `8000` is hidden from the public and reverse proxied by Nginx.
- **Liquidsoap (`liquidsoap`):** Acts as the audio routing engine, handles automated fallback, and ingests live DJ input. Ingests harbor connection on port `8005` (must be protected by firewall/security groups).

### B. Nginx SSL Termination (`radio/nginx/nginx.conf`)
- Implements port 80 to 443 redirects.
- Serves `/radio` mount over HTTPS with Let's Encrypt certificates.
- Disables proxy buffering (`proxy_buffering off`) for instantaneous real-time streaming without buffers.

### C. Liquidsoap Scripting (`radio/liquidsoap/radio.liq`)
Implements automated stream rotation and zero-downtime fallback switching:
1. **Harbor Input (`live_harbor`):** Listens on port `8005` with mount path `/live` for live DJ connection.
2. **Partitioned Playlist Rotation:**
   - **Featured Playlist (`featured_playlist`):** Pulls from `/music/playlist/featured/` (featured=true).
   - **General Playlist (`general_playlist`):** Pulls from `/music/playlist/submissions/` (approved submissions).
   - **Weighted Combine:** Blends them together via a **60/40 weighted selection**:
     ```liquidsoap
     playlist_source = random.weighted([ (60, featured_playlist), (40, general_playlist) ])
     ```
3. **Seamless Transition:**
   ```liquidsoap
   radio = fallback(track_sensitive=false, [live_harbor, playlist_source])
   ```
   *When the DJ connects via BUTT, Liquidsoap immediately cuts over to the live set; when the DJ disconnects, it gracefully reverts to the weighted playlist rotation.*
4. **State & Playout Webhook Sync:**
   - Triggers on harbor connect/disconnect to toggle `is_live`.
   - Triggers `on_metadata` on the final active stream (`radio`) to POST metadata updates (artist, title, filename) to the Next.js `api/radio/live-status` webhook. This updates `now_playing_title` continuously during both DJ sets and automated rotation.

### D. Playlist Syncing (`radio/sync-tracks.sh`)
A cron-friendly bash script that:
1. Queries the Supabase `submissions` table for approved submissions.
2. Segregates tracks into `playlist/featured` and `playlist/submissions` directories depending on the `featured` database flag.
3. Automatically triggers promotions and demotions by cleaning up files in opposing directories and deleting decommissioned tracks independently.

---

## 3. Database Schema Extensions

To support the radio stack and administrative curation, the following changes were applied to the Supabase database:

```sql
-- Track Curation & Rotation Weights
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;

-- Live Transmission State
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS is_live BOOLEAN DEFAULT false;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS now_playing_title TEXT DEFAULT 'OFFLINE';

-- Public Read Permissions
GRANT SELECT ON public.system_settings TO anon, authenticated;
```

---

## 4. Frontend Next.js Web App Integration

The frontend has been updated to support persistent, audio-only live streaming.

### A. Core Audio Controller (`components/RadioPlayer.tsx`)
- Placed globally inside the root `layout.tsx`.
- Uses a hidden HTML5 `<audio>` element with `crossOrigin="anonymous"` to bypass visualizer canvas issues.
- Connects to the global Zustand store (`useAudioStore`).
- Subscribes to `NEXT_PUBLIC_RADIO_STREAM_URL` (default: `https://radio.immortalraindrops.art/radio`).
- **Buffer Management:** Clears the audio source element on pause, and initializes/re-assigns it on play to prevent browser audio drift and buffering delays.

### B. Real-time Live Page (`components/LiveBroadcast.tsx` / `app/live/page.tsx`)
- Server-side component fetches initial `is_live` and `now_playing_title` from Supabase to prevent layout shifts.
- Client-side `LiveBroadcast` component initiates a real-time Postgres channel listener on `system_settings` to dynamically reflect "TRANSMITTING" and song titles instantaneously without browser refreshes.
- Custom "TUNE IN" button connects directly to the audio store's live-stream controller.

### C. Webhook Handler (`app/api/radio/live-status/route.ts`)
- Listens for webhook posts from the Liquidsoap VPS.
- Enforces security using an `X-Webhook-Secret` header matching `LIVE_STATUS_WEBHOOK_SECRET`.
- Uses the Supabase Service Role client to update `is_live` and `now_playing_title` in the database, bypassing standard Row Level Security (RLS).

### D. Admin Panel Curation (`components/admin/SubmissionReview.tsx`)
- Integrates a `featured` toggle button for approved submissions.
- Calls Server Action `toggleSubmissionFeatured` in `app/godmode/actions.ts` to allow admins/DJs to elevate specific tracks in the playlist rotation.

---

## 5. Decommissioning & Cleanup

Legacy Owncast and video dependencies have been purged:
- `hls.js` has been removed from `package.json` dependencies.
- `components/CustomVideoPlayer.tsx` and `components/FullScreenVideoOverlay.tsx` have been deleted.
- Webhook routes under `app/api/webhooks/owncast/route.ts` are deprecated/removed.
- Root layout file `app/layout.tsx` was rewritten to remove references to the video overlay.

---

## 6. Deployment & Settings Guide

### Environment Variables (.env / .env.local)
```bash
# Next.js Application Settings
NEXT_PUBLIC_SUPABASE_URL="https://your-supabase-url.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Storage Configuration
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="immortal-assets"
NEXT_PUBLIC_R2_PUBLIC_DOMAIN="assets.immortalraindrops.art"

# Radio Setup
NEXT_PUBLIC_RADIO_STREAM_URL="https://radio.immortalraindrops.art/radio"
LIVE_STATUS_WEBHOOK_SECRET="your-secure-webhook-token"
```

### VPS Docker Deployment Setup
1. Transfer the `/radio` directory to your streaming VPS.
2. Edit `.env` inside `/radio` with matching database keys and the `LIVE_STATUS_WEBHOOK_SECRET`.
3. Spin up the docker stack:
   ```bash
   docker-compose up -d
   ```
4. Setup a cronjob to run `sync-tracks.sh` every 15-30 minutes to dynamically download and update tracks.
5. In your broadcasting software (e.g. BUTT), configure connections to `your-vps-ip`, port `8005`, mountpoint `/live`, password, and Icecast stream type.

---

## 7. Fly.io Deployment Configuration & Checklist

For high-availability hosting, the radio stack is deployed on Fly.io as a multi-process machine.

### A. Deployment Commands
Run the following commands to provision and deploy:
```bash
# 1. Navigate to the radio directory containing Dockerfile and fly.toml
cd /Users/ruslangilmanov/immortalraindrops/radio

# 2. Initialize the Fly application (skip if already created)
fly apps create immortal-radio

# 3. Create a persistent volume to store downloaded tracks (1GB size in lhr region)
fly volumes create radio_data --region lhr --size 1

# 4. Set required database and webhook secrets securely on Fly.io
fly secrets set \
  NEXT_PUBLIC_SUPABASE_URL="https://ajbkuiyhpoiuezsittpy.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-supabase-service-role-key" \
  NEXT_PUBLIC_R2_PUBLIC_DOMAIN="pub-83e39df2389c4bef95c442c0e0c6a8ad.r2.dev" \
  LIVE_STATUS_WEBHOOK_URL="https://immortalraindrops.art/api/radio/live-status" \
  LIVE_STATUS_WEBHOOK_SECRET="your-secure-webhook-token" \
  ICECAST_SOURCE_PASSWORD="your-secure-source-password"

# 5. Deploy the application to Fly.io Machines
fly deploy
```

### B. Deployment Checklist
- [ ] Fly.io CLI is installed and authenticated (`fly auth login`).
- [ ] `fly.toml` is present in the `radio/` directory.
- [ ] Subdomain `radio.immortalraindrops.art` CNAME is pointed to your Fly.io app domain (e.g., `immortal-radio.fly.dev`).
- [ ] SSL certificate is generated in Fly.io dashboard for `radio.immortalraindrops.art`.
- [ ] Vercel environmental variables match the `LIVE_STATUS_WEBHOOK_SECRET` used by the Fly application.
- [ ] BUTT broadcaster client is configured with your Fly.io public IP/host, port `8005`, username `dj`, password `ICECAST_SOURCE_PASSWORD`, and stream mount `/live`.
