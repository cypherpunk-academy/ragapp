import type { Session, User } from '@supabase/supabase-js';
import { config } from '@/data/lib/config';
import { getSupabase } from '@/data/lib/supabase';

export type AuthState = {
  session: Session | null;
  user: User | null;
};

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

  async signInWithMagicLink(email: string): Promise<void> {
    if (!this.isAvailable()) {
      throw new Error('Supabase is not configured.');
    }
    const { error } = await getSupabase().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
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
