import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { config } from '@/data/lib/config';
import { getSupabase } from '@/data/lib/supabase';

export type AuthState = {
  session: Session | null;
  user: User | null;
};

function otpRedirectTo(): string | undefined {
  try {
    return Linking.createURL('/(tabs)');
  } catch {
    return undefined;
  }
}

/** True when magic-link sign-in was restricted to existing users but none matched. */
export function authErrorSuggestsNewAccount(error: unknown): boolean {
  const code =
    error && typeof error === 'object' && 'code' in error && typeof (error as { code: unknown }).code === 'string'
      ? (error as { code: string }).code
      : undefined;
  if (code === 'user_not_found' || code === 'identity_not_found') return true;
  const message =
    error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string'
      ? (error as { message: string }).message
      : '';
  const lower = message.toLowerCase();
  return lower.includes('user not found') || lower.includes('no user');
}

export const authService = {
  isAvailable(): boolean {
    return config.supabase.isConfigured;
  },

  async getSession(): Promise<Session | null> {
    if (!this.isAvailable()) return null;
    const { data, error } = await getSupabase().auth.getSession();
    if (error) throw error;
    return data.session;
  },

  /**
   * Magic link only if the email already has an account (no implicit sign-up).
   * On “unknown email”, use {@link signUpWithMagicLink} after collecting a display name.
   */
  async signInWithMagicLinkExistingUser(email: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Supabase is not configured.');
    }
    const redirect = otpRedirectTo();
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        ...(redirect ? { emailRedirectTo: redirect } : {}),
      },
    });
    if (error) throw error;
  },

  /** Create-or-send magic link for a new account; `displayName` is stored in user metadata. */
  async signUpWithMagicLink(email: string, displayName: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Supabase is not configured.');
    }
    const redirect = otpRedirectTo();
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        ...(redirect ? { emailRedirectTo: redirect } : {}),
        data: {
          full_name: displayName.trim(),
          display_name: displayName.trim(),
        },
      },
    });
    if (error) throw error;
  },

  async signOut(): Promise<void> {
    if (!this.isAvailable()) return;
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    if (!this.isAvailable()) {
      callback({ session: null, user: null });
      return () => {};
    }

    const { data } = getSupabase().auth.onAuthStateChange((_event, session) => {
      callback({ session, user: session?.user ?? null });
    });

    return () => data.subscription.unsubscribe();
  },
};
