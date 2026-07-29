#!/bin/bash
# Detects current local IP and writes envs/local to .env with the correct ragrun URL.
set -e

IP=$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || true)
if [ -z "$IP" ]; then
  echo "Error: Could not detect local WiFi IP (en0/en1)" >&2
  exit 1
fi

sed "s|EXPO_PUBLIC_RAGRUN_BASE_URL=http://[0-9.]*:8000|EXPO_PUBLIC_RAGRUN_BASE_URL=http://$IP:8000|" \
  envs/local > .env.local

# Remove staging .env so .env.local takes effect
rm -f .env

echo "Switched to local (ragrun @ $IP:8000)"
