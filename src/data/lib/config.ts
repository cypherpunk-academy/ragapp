import Constants from 'expo-constants';

type AppExtra = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  ragrunBaseUrl?: string;
};

function readExtra(): AppExtra {
  return (Constants.expoConfig?.extra ?? {}) as AppExtra;
}

function requireNonEmpty(value: string | undefined): string {
  return value?.trim() ?? '';
}

const extra = readExtra();

export const config = {
  supabase: {
    url: requireNonEmpty(extra.supabaseUrl),
    anonKey: requireNonEmpty(extra.supabaseAnonKey),
    get isConfigured(): boolean {
      return Boolean(this.url && this.anonKey);
    },
  },
  ragrun: {
    // /app/* routes live at server root — not under /api/v1
    baseUrl: requireNonEmpty(extra.ragrunBaseUrl)
      .replace(/\/$/, '')
      .replace(/\/api\/v1$/, ''),
    get isConfigured(): boolean {
      return Boolean(this.baseUrl);
    },
  },
} as const;

export function assertSupabaseConfigured(): void {
  if (!config.supabase.isConfigured) {
    throw new Error(
      'Supabase is not configured. Copy .env.example to .env and set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.',
    );
  }
}

export function assertRagrunConfigured(): void {
  if (!config.ragrun.isConfigured) {
    throw new Error(
      'ragrun is not configured. Copy .env.example to .env and set EXPO_PUBLIC_RAGRUN_BASE_URL.',
    );
  }
}
