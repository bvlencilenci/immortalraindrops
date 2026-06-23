# DJ Broadcast Setup — Immortal Raindrops

This guide covers everything you need to go live on Immortal Raindrops Radio using **BUTT (Broadcast Using This Tool)** through the Fly.io WireGuard tunnel.

---

## Installation

Download BUTT from: **https://danielnoethen.de/butt/**

Available for macOS, Windows, and Linux. Install it like any standard application.

---

## Before You Start

- You must have the **fly CLI** installed and be logged in:
  ```
  fly auth login
  ```
- You must run `./dj-connect.sh` from the project root **before** opening BUTT and hitting Connect.
- The tunnel must be active and show the confirmation block before you connect.

---

## Step 1 — Start the Tunnel

From the project root:

```bash
./dj-connect.sh
```

Wait for this output before proceeding:

```
----------------------------------------
  Tunnel active on 127.0.0.1:8005
        Open BUTT and hit Connect
     Press Ctrl+C to close the tunnel
----------------------------------------
```

> **Do not close this terminal.** The tunnel stays alive until you press `Ctrl+C`.

---

## Step 2 — Configure BUTT

Open BUTT and go to **Settings**.

### Main Tab

| Field | Value |
|---|---|
| Server type | **Icecast** |
| Address | `127.0.0.1` |
| Port | `8005` |
| Password | Value of `LIQUIDSOAP_HARBOR_PASSWORD` env var (falls back to `ICECAST_SOURCE_PASSWORD` if not set — check your Fly.io secrets with `fly secrets list -a immortal-radio`) |
| Icecast mountpoint | `/live` |

Click **Add** to save the server, then select it as the active server.

### Audio Tab

| Field | Value |
|---|---|
| Input device | Your audio interface or system default |
| Sample rate | `44100 Hz` |
| Codec | `MP3` |
| Bitrate | `192 kbps` minimum — `320 kbps` preferred for quality sets |
| Channel | `Stereo` |

### Stream Tab

- **Song name updates**: optional — can leave blank.
- Disable **"read song name from file"** unless you want live track metadata pushed to the stream.

---

## Step 3 — Go Live

1. Run `./dj-connect.sh` and wait for tunnel confirmation.
2. Open BUTT.
3. Hit **Connect** — the status bar should change to `connected`.
4. Verify in another terminal:
   ```bash
   fly logs -a immortal-radio
   ```
   You should see:
   ```
   >>> DJ CONNECTED!
   ```
5. The live Harbor input **automatically overrides the playlist** — no manual switch needed. The stream switches to your audio instantly.

---

## Step 4 — End the Broadcast

1. Hit **Disconnect** in BUTT first.
2. Then press `Ctrl+C` in the terminal running `./dj-connect.sh`.
3. The stream automatically returns to the 24/7 playlist rotation.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Connection refused` | Tunnel isn't running — run `./dj-connect.sh` first |
| `Wrong password` | Check `LIQUIDSOAP_HARBOR_PASSWORD` (or `ICECAST_SOURCE_PASSWORD`) in your Fly.io secrets |
| Connected but no audio on stream | Check BUTT's audio input device selection in the Audio tab |
| Stream cuts out mid-set | Check internet stability — try lowering bitrate to `128 kbps` |
| `fly proxy` exits immediately | Make sure you're authenticated: `fly auth whoami` |
| Logs show connected but no override | Confirm Liquidsoap is running: `fly ssh console -a immortal-radio -C 'supervisorctl status'` |
