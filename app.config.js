/** @type {import('expo/config').ExpoConfig} */
const config = {
  name: 'ragapp',
  slug: 'ragapp',
  owner: 'lafisrap',
  scheme: 'ragapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: false,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    requireFullScreen: true,
    bundleIdentifier: 'berlin.cypherpunkacademy.ragapp',
    usesAppleSignIn: true,
    infoPlist: {
      'UISupportedInterfaceOrientations~ipad': ['UIInterfaceOrientationPortrait'],
    },
  },
  android: {
    package: 'berlin.cypherpunkacademy.ragapp',
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
