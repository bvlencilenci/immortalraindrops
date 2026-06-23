#!/usr/bin/env bash
# generate-secrets.sh — Generate and set radio broadcast passwords on Fly.io
# Creates cryptographically secure passwords for Icecast source and Liquidsoap Harbor.

set -euo pipefail

APP="immortal-radio"

# ─── ANSI colours ──────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── 1. Check fly CLI is installed ─────────────────────────────────────────────
if ! command -v fly &>/dev/null; then
  echo -e "${RED}ERROR:${RESET} fly CLI not found."
  echo ""
  echo "Install it with:"
  echo "  curl -L https://fly.io/install.sh | sh"
  echo "  or: brew install flyctl"
  exit 1
fi

# ─── 2. Check fly authentication ───────────────────────────────────────────────
FLY_USER=$(fly auth whoami 2>/dev/null || true)
if [[ -z "$FLY_USER" ]]; then
  echo -e "${RED}ERROR:${RESET} Not authenticated with Fly.io."
  echo ""
  echo "Run:  fly auth login"
  echo "Then re-run this script."
  exit 1
fi

echo -e "${CYAN}Authenticated as:${RESET} ${FLY_USER}"
echo ""

# ─── 3. Generate passwords ─────────────────────────────────────────────────────
ICECAST_PW=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32)
HARBOR_PW=$(openssl rand -base64 48 | tr -dc 'A-Za-z0-9' | head -c 32)

echo -e "${BOLD}${GREEN}----------------------------------------${RESET}"
echo -e "${BOLD}  Generated secrets:${RESET}"
echo ""
echo -e "  ICECAST_SOURCE_PASSWORD=${CYAN}${ICECAST_PW}${RESET}"
echo -e "  LIQUIDSOAP_HARBOR_PASSWORD=${CYAN}${HARBOR_PW}${RESET}"
echo ""
echo -e "  ${YELLOW}Save LIQUIDSOAP_HARBOR_PASSWORD — this goes in BUTT's password field.${RESET}"
echo -e "${BOLD}${GREEN}----------------------------------------${RESET}"
echo ""

# ─── 4. Confirm before setting ─────────────────────────────────────────────────
read -rp "Press Enter to set these on Fly.io or Ctrl+C to abort "
echo ""

# ─── 5. Set secrets on Fly.io ──────────────────────────────────────────────────
echo -e "${YELLOW}Setting secrets on ${APP}...${RESET}"
fly secrets set \
  "ICECAST_SOURCE_PASSWORD=${ICECAST_PW}" \
  "LIQUIDSOAP_HARBOR_PASSWORD=${HARBOR_PW}" \
  -a "${APP}"

# ─── 6. Confirmation ───────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}✓ Secrets set successfully on ${APP}.${RESET}"
echo ""
echo -e "Redeploy to apply:"
echo -e "  ${BOLD}cd radio && fly deploy -a ${APP}${RESET}"
