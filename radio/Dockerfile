FROM savonet/liquidsoap:v2.2.4

USER root

# Install dependencies (Nginx, Icecast2, Supervisor, Python3)
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    nginx \
    icecast2 \
    supervisor \
    curl \
    python3 \
    ca-certificates \
    procps && \
    rm -rf /var/lib/apt/lists/*

# Set up logging and run directories for Nginx, Icecast, and Supervisor
RUN mkdir -p /var/log/nginx /var/log/icecast /var/log/liquidsoap /var/log/supervisor /var/run && \
    chown -R nobody:nogroup /var/log/icecast && \
    chown -R liquidsoap:liquidsoap /var/log/liquidsoap

# Copy configuration files into place
COPY nginx/nginx_fly.conf /etc/nginx/nginx.conf
COPY icecast/icecast.xml /etc/icecast2/icecast.xml
COPY liquidsoap/radio.liq /etc/liquidsoap/radio.liq
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Setup working directory and scripts
WORKDIR /radio
COPY sync-tracks.sh /radio/sync-tracks.sh
COPY sync-daemon.sh /radio/sync-daemon.sh
RUN chmod +x /radio/sync-tracks.sh /radio/sync-daemon.sh

# Ensure proper configuration file permissions
RUN chown -R root:root /etc/nginx/nginx.conf && \
    chown -R icecast2:icecast /etc/icecast2/icecast.xml && \
    chown liquidsoap:liquidsoap /etc/liquidsoap/radio.liq

# Create persistent storage directories mapping to the volume mount
RUN mkdir -p /music/playlist/featured /music/playlist/submissions && \
    chown -R liquidsoap:liquidsoap /music && \
    chmod -R 775 /music && \
    # Create symlink so liquidsoap can access /music/playlist from /music/playlist
    ln -s /music/playlist /music/playlist/playlist || true

# Expose ports:
# 80: HTTP web stream proxy (Nginx)
# 8005: DJ live harbor stream (Liquidsoap TCP)
EXPOSE 80 8005

# Start Supervisord to manage all processes
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
