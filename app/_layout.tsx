import '@/shared/i18n';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/shared/theme';
import { useAppFonts } from '@/shared/hooks/useAppFonts';
import { useCorpusUpdate } from '@/shared/hooks/useCorpusUpdate';
import { SettingsProvider } from '@/shared/contexts/SettingsContext';
import { authService } from '@/data/services/authService';
import { parseDeepLink } from '@/data/services/deepLinkService';
import { useAuth } from '@/shared/hooks/useAuth';
import BootLoadingView from '@/shared/components/BootLoadingView';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [fontsLoaded, fontError] = useAppFonts();
  const { loading: authLoading } = useAuth();

  // Corpus OTA update on mount & foreground
  useCorpusUpdate((from, to) => {
    console.log(`[corpus-ota] updated: v${from} → v${to}`);
  });

  // Handle Supabase Magic Link deep links (e.g. ragapp://auth/callback?code=...)
  // Passage/text deep links are handled by useDeepLinkHandler in (tabs)/_layout.tsx.
  useEffect(() => {
    function handleAuthLink(url: string) {
      if (parseDeepLink(url)) return; // passage/text link — handled elsewhere
      void authService.handleDeepLink(url);
    }
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthLink(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleAuthLink(url);
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
          <Stack.Screen name="deep-link-test" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </SettingsProvider>
  );
}
