import { useCallback } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/shared/hooks/useAuth';

export function useAccountMenu() {
  const { isAuthenticated, loading } = useAuth();

  const openKonto = useCallback(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }
    router.push('/konto');
  }, [isAuthenticated, loading]);

  const openSettings = useCallback(() => {
    router.push('/einstellungen');
  }, []);

  return { openKonto, openSettings };
}
