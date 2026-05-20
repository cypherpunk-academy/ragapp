import { useEffect, useState } from 'react';
import { authService, type AuthState } from '@/data/services/authService';

const initialState: AuthState = { session: null, user: null };

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAvailable()) {
      setLoading(false);
      return;
    }

    let active = true;

    authService
      .getSession()
      .then((session) => {
        if (!active) return;
        setState({ session, user: session?.user ?? null });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange((next) => {
      if (active) setState(next);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const isConfigured = authService.isAvailable();
  /** Ohne Supabase-Env: vorübergehend als angemeldet gelten (lokaler Betrieb); sobald Supabase konfiguriert ist, zählt nur die echte Session. */
  const isAuthenticated = Boolean(state.session) || !isConfigured;

  return {
    ...state,
    loading,
    isConfigured,
    isAuthenticated,
    signInWithMagicLinkExistingUser: authService.signInWithMagicLinkExistingUser.bind(authService),
    signUpWithMagicLink: authService.signUpWithMagicLink.bind(authService),
    signOut: authService.signOut.bind(authService),
  };
}
