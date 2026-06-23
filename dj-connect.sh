#!/bin/bash

if ! command -v fly &> /dev/null; then
  echo "Error: fly CLI not installed. Visit https://fly.io/docs/hands-on/install-flyctl/"
  exit 1
fi

if ! fly auth whoami &> /dev/null; then
  echo "Error: not logged in. Run: fly auth login"
  exit 1
fi

echo "Starting tunnel to immortal-radio:8005..."
fly proxy 8005:8005 -a immortal-radio > /Users/ruslangilmanov/immortalraindrops/dj-connect.log 2>&1 &
PROXY_PID=$!

sleep 2

if ! kill -0 $PROXY_PID 2>/dev/null; then
  echo "Error: tunnel failed to start"
  exit 1
fi

echo "----------------------------------------"
echo "Tunnel active on 127.0.0.1:8005"
echo "Open BUTT and hit Connect"
echo "Press Ctrl+C to close the tunnel"
echo "----------------------------------------"

trap "kill $PROXY_PID 2>/dev/null; echo 'Tunnel closed'" SIGINT SIGTERM

wait $PROXY_PID
