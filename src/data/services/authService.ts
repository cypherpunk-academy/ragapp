import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import { config } from '@/data/lib/config';
import { getSupabase } from '@/data/lib/supabase';

// Install: npx expo install expo-apple-authentication
// Also add "usesAppleSignIn": true to app.config.ts → ios.infoPlist
let AppleAuthentication: typeof import('expo-apple-authentication') | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AppleAuthentication = require('expo-apple-authentication') as typeof import('expo-apple-authentication');
} catch {
  // package not installed — Apple Sign-In unavailable
}

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

  /** True when Apple Sign-In is available (iOS 13+ and package installed). */
  isAppleSignInAvailable(): boolean {
    if (Platform.OS !== 'ios') return false;
    if (!AppleAuthentication) return false;
    return true;
  },

  /**
   * Sign in with Apple ID.
   * Requires expo-apple-authentication to be installed and
   * "usesAppleSignIn": true in app.config.ts → ios.infoPlist.
   */
  async signInWithApple(): Promise<void> {
    if (!this.isAvailable()) throw new Error('Supabase is not configured.');
    if (!AppleAuthentication) throw new Error('expo-apple-authentication is not installed.');

    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    if (!credential.identityToken) throw new Error('Apple did not return an identity token.');

    const { error } = await getSupabase().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    if (error) throw error;
  },

  /**
   * Handle a deep-link URL that Supabase redirected to after Magic Link click.
   * Call this from the root layout's Linking listener.
   */
  async handleDeepLink(url: string): Promise<void> {
    if (!this.isAvailable()) return;
    // Supabase PKCE flow sends ?code=..., legacy OTP sends #access_token=...
    if (!url.includes('access_token') && !url.includes('code=')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabase().auth as any).getSessionFromUrl({ url });
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
