import { Linking } from 'react-native';

import { ragrunRequest } from '@/data/lib/ragrun-client';

export type DeepLinkConfig = {
  strategy: string;
  claude_base_url: string;
  auto_send?: boolean;
  passage_base_url?: string;
  text_base_url?: string;
};

const FALLBACK_CLAUDE_BASE = 'https://claude.ai/new';

export async function fetchDeepLinkConfig(): Promise<DeepLinkConfig> {
  return ragrunRequest<DeepLinkConfig>('/app/deep-link-config', {
    authenticated: false,
  });
}

/** Open a Claude new-chat URL from GET /app/deep-link-config (with hardcoded fallback). */
export async function openClaudeNewChat(query?: string): Promise<void> {
  let base = FALLBACK_CLAUDE_BASE;
  try {
    const cfg = await fetchDeepLinkConfig();
    if (cfg.claude_base_url?.trim()) {
      base = cfg.claude_base_url.trim().replace(/\/$/, '');
    }
  } catch (e) {
    console.warn('[deepLinkConfig] fetch failed, using fallback:', e);
  }
  const url = query ? `${base}?q=${encodeURIComponent(query)}` : base;
  await Linking.openURL(url);
}
