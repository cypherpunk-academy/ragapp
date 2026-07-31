#!/usr/bin/env bash
# Installiert/startet die App auf dem ersten laufenden Emulator.
# Expo --device matcht nur den AVD-Namen und kollidiert z. B. mit einem
# physischen Pixel_8 — deshalb Installation per ADB-Serial, nicht per Expo-Namen.
set -euo pipefail
cd "$(dirname "$0")/.."

SERIAL=$(adb devices | awk '/^emulator-/{print $1; exit}')
if [[ -z "${SERIAL}" ]]; then
  echo "Kein laufender Emulator in \`adb devices\`." >&2
  exit 1
fi

AVD=$(adb -s "${SERIAL}" emu avd name 2>/dev/null | head -1 | tr -d '\r' || true)
echo "→ Emulator: ${SERIAL}${AVD:+ (AVD: ${AVD})}"

if [[ ! -d android ]]; then
  echo "→ android/ fehlt — expo prebuild…"
  npx expo prebuild --platform android
fi

export ANDROID_SERIAL="${SERIAL}"
(
  cd android
  ./gradlew "app:installDebug" -x lint -x test --configure-on-demand \
    -PreactNativeDevServerPort=8081
)

PKG=berlin.cypherpunkacademy.ragapp
adb -s "${SERIAL}" shell monkey -p "${PKG}" -c android.intent.category.LAUNCHER 1

exec npx expo start --dev-client -p 8081
