#!/usr/bin/env bash
# Sync assets/icon.png and assets/splash-icon.png into native iOS asset catalogs.
# expo prebuild does not refresh these when source assets change.
set -euo pipefail
cd "$(dirname "$0")/.."

if [[ ! -d ios ]]; then
  echo "ERROR: ios/ missing — run: npx expo prebuild --platform ios" >&2
  exit 1
fi

ICON_SRC=assets/icon-ios.png
ICON_DEST=ios/ragapp/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png
if [[ ! -f "${ICON_SRC}" ]]; then
  echo "ERROR: ${ICON_SRC} not found" >&2
  exit 1
fi
sips -z 1024 1024 "${ICON_SRC}" --out "${ICON_DEST}" >/dev/null
echo "→ Synced iOS app icon from ${ICON_SRC}"

SPLASH_SRC=assets/splash-icon.png
SPLASH_DIR=ios/ragapp/Images.xcassets/SplashScreenLogo.imageset
# Matches expo-splash-screen imageWidth: 200 in app.config.js
if [[ ! -f "${SPLASH_SRC}" ]]; then
  echo "ERROR: ${SPLASH_SRC} not found" >&2
  exit 1
fi
sips -Z 200 "${SPLASH_SRC}" --out "${SPLASH_DIR}/image.png" >/dev/null
sips -Z 400 "${SPLASH_SRC}" --out "${SPLASH_DIR}/image@2x.png" >/dev/null
sips -Z 600 "${SPLASH_SRC}" --out "${SPLASH_DIR}/image@3x.png" >/dev/null
echo "→ Synced iOS splash logo from ${SPLASH_SRC}"
