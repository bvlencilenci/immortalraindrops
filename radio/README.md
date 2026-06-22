# Containerized Icecast/Liquidsoap Radio Stack

This folder contains the complete, containerized radio infrastructure for the **Immortal Raindrops** platform.

## Folder Structure
- `docker-compose.yml`: Orchestrates Nginx, Icecast, and Liquidsoap.
- `nginx/nginx.conf`: Nginx configuration mapping `/radio` with SSL termination to Icecast.
- `liquidsoap/radio.liq`: Liquidsoap audio controller with harbor streaming, fallback, dynamic 60/40 weighted playlist, and webhook metadata advance notifications.
- `sync-tracks.sh`: Sync script downloading submissions into partitioned folders.
- `.env.example`: Template for environment variables.

---

## SSL / HTTPS Setup via Let's Encrypt (Certbot)

To prevent mixed-content blocking in modern browsers, HTTPS/SSL is mandatory on the stream URL. 

### Method A: Host-Level Certbot
1. Install Certbot on the host:
   ```bash
   sudo apt-get update && sudo apt-get install certbot
   ```
2. Obtain a standalone certificate for your subdomain:
   ```bash
   sudo certbot certonly --standalone -d radio.immortalraindrops.art
   ```
3. Map the host certificate folder inside `docker-compose.yml` to the Nginx certs volume:
   - Change `./nginx/certs:/etc/nginx/certs:ro` in `docker-compose.yml` to `/etc/letsencrypt:/etc/nginx/certs:ro`.
4. Ensure Nginx configuration paths correctly match:
   - `/etc/nginx/certs/live/radio.immortalraindrops.art/fullchain.pem`
   - `/etc/nginx/certs/live/radio.immortalraindrops.art/privkey.pem`

### Method B: Cloudflare Tunnel (Alternative)
If using a Cloudflare Tunnel:
1. Point your tunnel config directly to `http://nginx:80`.
2. Disable port `443` in `docker-compose.yml` for Nginx and strip the `listen 443 ssl` block from `nginx.conf`. Cloudflare will handle all SSL termination automatically.

---

## Playlist Rotation Curation
- The radio playout splits tracks into two folders:
  - `playlist/featured/` (featured tracks)
  - `playlist/submissions/` (general approved tracks)
- Liquidsoap mixes these two sources using a **60/40 weighted selection** (configurable inside `radio.liq`).
- `sync-tracks.sh` downloads tracks to the appropriate directory based on the `featured` database flag and handles promotion/demotion between folders.
- Since Liquidsoap is configured with `reload_mode="watch"`, it monitors folders and reloads new additions instantly without stream restarts.

---

## Playout & Playout Sync Setup
1. Copy `.env.example` to `.env` and fill out your credentials.
2. Spin up the containers:
   ```bash
   docker-compose up -d
   ```
3. Set up a crontab entry to run `sync-tracks.sh` periodically to download new submissions:
   ```bash
   */15 * * * * cd /path/to/radio && ./sync-tracks.sh >> sync.log 2>&1
   ```
