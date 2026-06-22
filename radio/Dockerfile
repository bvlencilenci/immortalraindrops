FROM savonet/liquidsoap:v2.2.4

USER root

# Install dependencies (Nginx, Icecast2, Supervisor, Python3, gettext for envsubst)
RUN echo "icecast2 icecast2/DEFAULTS_GENERATE boolean false" | debconf-set-selections && \
    apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    nginx \
    icecast2 \
    supervisor \
    curl \
    python3 \
    ca-certificates \
    procps \
    gettext-base && \
    rm -rf /var/lib/apt/lists/*

# Set up logging and run directories for Nginx, Icecast, and Supervisor
RUN mkdir -p /var/log/nginx /var/log/icecast /var/log/liquidsoap /var/log/supervisor /var/run && \
    chown -R nobody:nogroup /var/log/icecast && \
    chown -R liquidsoap:liquidsoap /var/log/liquidsoap

# Copy configuration files into place
COPY nginx/nginx_fly.conf /etc/nginx/nginx.conf
# Store as template — entrypoint will substitute env vars at startup
COPY icecast/icecast.xml.tmpl /etc/icecast2/icecast.xml.tmpl
COPY liquidsoap/radio.liq /etc/liquidsoap/radio.liq
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Setup working directory and scripts
WORKDIR /radio
COPY sync-tracks.sh /radio/sync-tracks.sh
COPY sync-daemon.sh /radio/sync-daemon.sh
COPY entrypoint.sh /radio/entrypoint.sh
RUN chmod +x /radio/sync-tracks.sh /radio/sync-daemon.sh /radio/entrypoint.sh

# Ensure proper configuration file permissions
RUN chown -R root:root /etc/nginx/nginx.conf && \
    chown liquidsoap:liquidsoap /etc/liquidsoap/radio.liq

# Create persistent storage directories (Fly volume mounted at /music at runtime)
RUN mkdir -p /music/unified/featured /music/unified/normal && \
    chown -R liquidsoap:liquidsoap /music && \
    chmod -R 775 /music

# Expose ports:
# 80: HTTP web stream proxy (Nginx)
# 8005: DJ live harbor stream (Liquidsoap TCP)
EXPOSE 80 8005

# Start via entrypoint which injects secrets before supervisord
ENTRYPOINT ["/radio/entrypoint.sh"]
