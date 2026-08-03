import { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// WatermelonDB Dual-Write: Client und ragrun schreiben denselben Talk/Turn (gleiche IDs
// aus dem SSE-Stream). WatermelonDB behandelt den Pull-Konflikt korrekt (update statt
// create). Die Warnung wird direkt auf console.error-Ebene unterdrückt, damit
// React Native kein LogBox-Overlay-Modal erstellt (sonst UIKit-Fehler + Touch-Block).
const _origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const first = args[0];
  const msg = first instanceof Error
    ? (first.message ?? '')
    : String(first ?? '');
  if (msg.includes('[Sync] Server wants client to create record')) {
    return;
  }
  _origConsoleError(...args);
};
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/shared/theme';
import { useAppFonts } from '@/shared/hooks/useAppFonts';
import { SettingsProvider } from '@/shared/contexts/SettingsContext';
import { authService } from '@/data/services/authService';
import { useAuth } from '@/shared/hooks/useAuth';
import { ensureSeeded } from '@/data/lib/seedLoader';
import { runSync } from '@/data/lib/sync';
import BootLoadingView from '@/shared/components/BootLoadingView';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [fontsLoaded] = useAppFonts();
  const { loading: authLoading, isAuthenticated } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    void ensureSeeded().catch((e) => {
      console.warn('[seed] failed:', e instanceof Error ? e.message : String(e));
    });
  }, []);

  useEffect(() => {
    if (authLoading || !isAuthenticated || hasSynced.current) return;
    hasSynced.current = true;
    void (async () => {
      await ensureSeeded().catch((e) => {
        console.warn('[seed] before startup sync failed:', e instanceof Error ? e.message : String(e));
      });
      const result = await runSync();
      if (!result.ok) {
        console.warn('[sync] startup failed:', result.error);
      }
    })();
  }, [authLoading, isAuthenticated]);

  // Handle Supabase Magic Link deep links (e.g. ragapp://auth/callback?code=...)
  useEffect(() => {
    Linking.getInitialURL().then((url) => {
      if (url) void authService.handleDeepLink(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      void authService.handleDeepLink(url);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return <BootLoadingView />;
  }

  return (
    <SettingsProvider>
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth-callback" options={{ animation: 'none' }} />
          <Stack.Screen name="konto" />
          <Stack.Screen name="einstellungen" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </SettingsProvider>
  );
}
