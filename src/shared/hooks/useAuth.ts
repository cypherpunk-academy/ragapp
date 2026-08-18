import { useEffect, useState } from 'react';
import { authService, type AuthState } from '@/data/services/authService';

const initialState: AuthState = { session: null, user: null };
const SESSION_TIMEOUT_MS = 8_000;

export function useAuth() {
  const [state, setState] = useState<AuthState>(initialState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAvailable()) {
      setLoading(false);
      return;
    }

    let active = true;

    const timeout = setTimeout(() => {
      if (!active) return;
      console.warn('[useAuth] getSession timeout — proceeding without session');
      setLoading(false);
    }, SESSION_TIMEOUT_MS);

    authService
      .getSession()
      .then((session) => {
        if (!active) return;
        setState({ session, user: session?.user ?? null });
      })
      .catch((err) => {
        console.warn('[useAuth] getSession error:', err instanceof Error ? err.message : err);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (active) setLoading(false);
      });

    const unsubscribe = authService.onAuthStateChange((next) => {
      if (active) setState(next);
    });

    return () => {
      active = false;
      clearTimeout(timeout);
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
