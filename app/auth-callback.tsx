import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/shared/hooks/useAuth';
import { lightColors } from '@/shared/theme';

/**
 * Intermediate screen for the Supabase Magic Link deep-link callback.
 * expo-router routes ragapp://auth-callback here.
 * The actual session exchange is handled in _layout.tsx via handleDeepLink().
 * This screen just waits until loading is done, then forwards to the main app.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { loading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!loading) {
      router.replace('/(tabs)');
    }
  }, [loading, isAuthenticated]);

  return (
    <View style={styles.root}>
      <ActivityIndicator size="large" color={lightColors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightColors.background },
});
