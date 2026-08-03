#!/usr/bin/env bash
# Start Android emulator + iPad simulator, build & install, then run Metro.
set -euo pipefail
cd "$(dirname "$0")/.."

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
echo "→ Building & installing Android debug APK on ${SERIAL}…"
(
  cd android
  ./gradlew "app:installDebug" -x lint -x test --configure-on-demand \
    -PreactNativeDevServerPort="${METRO_PORT}" --quiet
)

PKG=berlin.cypherpunkacademy.ragapp
adb -s "${SERIAL}" shell monkey -p "${PKG}" -c android.intent.category.LAUNCHER 1 2>/dev/null

# ── 3. Build iOS (if needed) ─────────────────────────────────────────────────

if [[ ! -d ios ]]; then
  echo "→ ios/ missing — running expo prebuild…"
  npx expo prebuild --platform ios
fi

echo "→ Building & installing iOS on iPad simulator…"
npx expo run:ios --device "${IPAD_UDID}" --no-bundler &
IOS_BUILD_PID=$!

# ── 4. Start Metro ──────────────────────────────────────────────────────────

echo "→ Starting Metro on port ${METRO_PORT}…"
wait "${IOS_BUILD_PID}" 2>/dev/null || true
exec npx expo start --dev-client -p "${METRO_PORT}"
