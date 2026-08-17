#!/usr/bin/env bash
# Start Android emulator + iPad simulator, build & install, then run Metro.
set -euo pipefail
cd "$(dirname "$0")/.."

# Refresh .env.local with current WiFi IP so emulators can reach ragrun.
bash scripts/env-local.sh

ANDROID_AVD="Pixel_8"
IPAD_SIM="iPad Pro 13-inch (M4)"
METRO_PORT=8081

# ── 1. Boot devices in parallel ──────────────────────────────────────────────

echo "→ Starting Android emulator (${ANDROID_AVD})…"
if ! adb devices | grep -q "^emulator-"; then
  "$HOME/Library/Android/sdk/emulator/emulator" -avd "${ANDROID_AVD}" -no-snapshot-load &
  EMULATOR_PID=$!
  echo "  Waiting for emulator to boot…"
  adb wait-for-device
  adb shell 'while [[ "$(getprop sys.boot_completed)" != "1" ]]; do sleep 1; done' 2>/dev/null
  echo "  Emulator ready."
else
  echo "  Emulator already running."
fi

echo "→ Booting iPad simulator (${IPAD_SIM})…"
IPAD_UDID=$(xcrun simctl list devices available | grep "${IPAD_SIM}" | head -1 | sed 's/.*(\([A-F0-9-]*\)).*/\1/')
if [[ -z "${IPAD_UDID}" ]]; then
  echo "  ERROR: iPad simulator '${IPAD_SIM}' not found." >&2
  exit 1
fi
xcrun simctl boot "${IPAD_UDID}" 2>/dev/null || true
open -a Simulator --args -CurrentDeviceUDID "${IPAD_UDID}"
echo "  iPad simulator ready (${IPAD_UDID})."

# ── 2. Build Android (if needed) ─────────────────────────────────────────────

if [[ ! -d android ]]; then
  echo "→ android/ missing — running expo prebuild…"
  npx expo prebuild --platform android
fi

SERIAL=$(adb devices | awk '/^emulator-/{print $1; exit}')
PKG=berlin.cypherpunkacademy.ragapp
# Production/staging APKs have higher versionCode — uninstall first to avoid INSTALL_FAILED_VERSION_DOWNGRADE.
if adb -s "${SERIAL}" shell pm path "${PKG}" 2>/dev/null | grep -q .; then
  echo "  Uninstalling existing ${PKG} (allows debug install over production build)…"
  adb -s "${SERIAL}" uninstall "${PKG}" >/dev/null 2>&1 || true
fi
echo "→ Building & installing Android debug APK on ${SERIAL}…"
(
  cd android
  ./gradlew "app:installDebug" -x lint -x test --configure-on-demand \
    -PreactNativeDevServerPort="${METRO_PORT}" --quiet
)

adb -s "${SERIAL}" shell monkey -p "${PKG}" -c android.intent.category.LAUNCHER 1 2>/dev/null

# ── 3. Build iOS (if needed) ─────────────────────────────────────────────────

if [[ ! -d ios ]]; then
  echo "→ ios/ missing — running expo prebuild…"
  npx expo prebuild --platform ios
fi

echo "→ Building & installing iOS on iPad simulator…"
bash scripts/run-ios-simulator.sh --no-metro &
IOS_BUILD_PID=$!

# ── 4. Start Metro ──────────────────────────────────────────────────────────

echo "→ Starting Metro on port ${METRO_PORT}…"
wait "${IOS_BUILD_PID}" 2>/dev/null || true
exec npx expo start --dev-client -p "${METRO_PORT}"
