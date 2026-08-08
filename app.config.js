const { execSync } = require('child_process');

const IS_STAGING = process.env.APP_VARIANT === 'staging';

/** Last 8 chars of the commit baked into this build (EAS or local git). */
function resolveGitCommitShort() {
  const fromEas = process.env.EAS_BUILD_GIT_COMMIT_HASH;
  if (fromEas) return fromEas.slice(0, 8);
  const fromEnv = process.env.EXPO_PUBLIC_GIT_COMMIT;
  if (fromEnv) return fromEnv.slice(0, 8);
  try {
    return execSync('git rev-parse --short=8 HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

const gitCommitShort = resolveGitCommitShort();

/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: IS_STAGING ? 'Philo (Staging)' : 'Philo von Freisinn',
  slug: 'ragapp',
  owner: 'lafisrap',
  scheme: 'ragapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    requireFullScreen: true,
    bundleIdentifier: IS_STAGING
      ? 'berlin.cypherpunkacademy.ragapp.staging'
      : 'berlin.cypherpunkacademy.ragapp',
    usesAppleSignIn: true,
    infoPlist: {
      'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationPortrait'],
    },
  },
  android: {
    package: IS_STAGING
      ? 'berlin.cypherpunkacademy.ragapp.staging'
      : 'berlin.cypherpunkacademy.ragapp',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-apple-authentication',
    'expo-updates',
    [
      'expo-splash-screen',
      {
        image: './assets/splash-icon.png',
        imageWidth: 200,
        resizeMode: 'contain',
        backgroundColor: '#FAF8FF',
      },
    ],
  ],
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '',
    ragrunBaseUrl: process.env.EXPO_PUBLIC_RAGRUN_BASE_URL ?? '',
    buildNumber: process.env.EAS_BUILD_APP_VERSION_CODE ?? '',
    gitCommitShort,
    eas: {
      projectId: '28c4e815-4398-499c-95e6-67c2d1b87e2d',
    },
  },
  updates: {
    url: 'https://u.expo.dev/28c4e815-4398-499c-95e6-67c2d1b87e2d',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
};

module.exports = config;
