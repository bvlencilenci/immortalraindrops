#!/bin/bash
# entrypoint.sh — Inject secrets into static config files before starting supervisord

set -e

echo "🔧 [entrypoint] Injecting secrets into icecast config..."

# ICECAST_SOURCE_PASSWORD must be set via 'flyctl secrets set'
# Substitute ${ICECAST_SOURCE_PASSWORD} placeholders in the icecast template
export ICECAST_SOURCE_PASSWORD="${ICECAST_SOURCE_PASSWORD:-changeme}"

envsubst '${ICECAST_SOURCE_PASSWORD}' \
  < /etc/icecast2/icecast.xml.tmpl \
  > /etc/icecast2/icecast.xml

chown icecast2:icecast /etc/icecast2/icecast.xml 2>/dev/null || true

echo "🔧 [entrypoint] Ensuring /music volume directories exist..."
mkdir -p /music/unified/featured /music/unified/normal
chown -R liquidsoap:liquidsoap /music 2>/dev/null || true
chmod -R 775 /music 2>/dev/null || true

echo "✅ [entrypoint] Config injection complete. Starting supervisord..."
exec supervisord -c /etc/supervisor/conf.d/supervisord.conf
