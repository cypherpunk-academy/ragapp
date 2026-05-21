import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors } from '@/shared/theme';
import { seedIfEmpty, seedDemoContributionsIfEmpty } from '@/data/lib/seedLoader';
import { useAppFonts } from '@/shared/hooks/useAppFonts';
import { authService } from '@/data/services/authService';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    seedIfEmpty()
      .then(() => seedDemoContributionsIfEmpty())
      .catch(console.error);
  }, []);

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
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaProvider>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="auth" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="konto" />
          <Stack.Screen name="einstellungen" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
