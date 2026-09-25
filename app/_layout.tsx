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
import { SettingsProvider } from '@/shared/contexts/SettingsContext';
import { authService } from '@/data/services/authService';
import { useAuth } from '@/shared/hooks/useAuth';
import BootLoadingView from '@/shared/components/BootLoadingView';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [fontsLoaded, fontError] = useAppFonts();
  const { loading: authLoading } = useAuth();

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
          <Stack.Screen name="deep-link-test" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
    </SettingsProvider>
  );
}
