# FLY.IO DEPLOYMENT AUDIT REPORT: IMMORTAL RAINDROPS RADIO STACK

This audit examines the Fly.io deployment misconfigurations and outlines the plan to build a production-ready containerized radio stack (Icecast + Liquidsoap + Nginx) optimized for Fly.io Machines.

---

## 1. Analysis of Current State & Root Cause

### A. Root Cause of Accidental Launch
- **Observation:** The user ran `fly launch` from `/Users/ruslangilmanov` (home directory) instead of the project root `/Users/ruslangilmanov/immortalraindrops/radio`.
- **Result:** Fly.io detected no application codebase, created a blank app named `ruslangilmanov` with default configuration (`internal_port = 8080`, no persistent volumes), and saved `fly.toml` in the user's home directory.

### B. Intended Target for Fly.io
- **Constraint:** The Next.js frontend is hosted on **Vercel**.
- **Conclusion:** **Fly.io should be used exclusively for the containerized radio stack** (`radio/` directory containing Nginx, Icecast, and Liquidsoap). The Next.js app will remain on Vercel.

---

## 2. Directory & Files Audit

### A. Files Found
- `radio/docker-compose.yml`: Current local Docker composition.
- `radio/icecast/icecast.xml`: Icecast server settings.
- `radio/liquidsoap/radio.liq`: Playout and fallback engine script.
- `radio/sync-tracks.sh`: Playout sync script.
- `radio/nginx/nginx.conf`: Nginx config (currently set for local SSL termination).

### B. Files Missing (For Fly.io)
- `radio/Dockerfile`: Production-ready multi-process Dockerfile to run Icecast, Liquidsoap, Nginx, and the sync daemon under a single Fly machine.
- `radio/fly.toml`: Fly.io configuration file specifying ports `80` (HTTP stream) and `8005` (TCP harbor), health checks, and persistent mounts.
- `radio/supervisord.conf`: Process manager configuration to keep Nginx, Icecast, Liquidsoap, and the cron-loop active.
- `radio/nginx/nginx_fly.conf`: Simplified HTTP-only Nginx configuration since Fly.io terminates SSL at the edge.

---

## 3. Discovered Misconfigurations & Architectural Adjustments

1. **SSL Handling on Fly.io:**
   - **Local Config:** The current local Nginx config terminations SSL internally on port 443 using Certbot certificates.
   - **Fly.io Config:** Fly.io automatically handles SSL termination at the Edge router, issuing its own Let's Encrypt certs and forwarding secure requests as HTTP to the container on port `80`.
   - **Resolution:** Create a simplified `nginx_fly.conf` listening on port `80` only, bypassing Certbot and local SSL configurations entirely.

2. **Multi-Container Composition:**
   - **Local Config:** Docker Compose runs 3 separate containers.
   - **Fly.io Config:** Fly.io Machines are single-container micro-VMs. Running multiple separate Fly apps is expensive and complicates shared volume mounts (for downloaded tracks).
   - **Resolution:** Consolidate Nginx, Icecast, Liquidsoap, and the sync cron script into a single Docker image managed by `supervisord`.

3. **Persistent Volume Requirement:**
   - **Problem:** If the container restarts, all downloaded tracks in `/music/playlist/` will be deleted, triggering stream silence.
   - **Resolution:** Configure a Fly.io persistent volume mount (`radio_data`) mapped to `/music` inside the container.

---

## 4. Proposed Modifications

### A. Create `radio/Dockerfile`
Build a multi-process image based on Debian/Ubuntu:
- Install Nginx, Icecast2, Liquidsoap, Supervisor, curl, ca-certificates, and python3.
- Set up directories and permissions (Liquidsoap requires `liquidsoap` user permissions).
- Expose port `80` (listener stream) and `8005` (DJ harbor).

### B. Create `radio/supervisord.conf`
Configure `supervisord` to run and monitor:
1. `nginx -g "daemon off;"`
2. `icecast2 -c /etc/icecast2/icecast.xml`
3. `liquidsoap /etc/liquidsoap/radio.liq`
4. A loop daemon running `sync-tracks.sh` every 15 minutes.

### C. Create `radio/fly.toml`
Expose the services:
- Port `80` mapped to HTTP and HTTPS (via Fly SSL termination).
- Port `8005` mapped directly to raw TCP (for BUTT broadcaster connection).
- Mount volume `radio_data` at `/music`.

### D. Create `radio/nginx/nginx_fly.conf`
- Listen on port `80`.
- Proxy `/radio` to `http://127.0.0.1:8000/radio`.
