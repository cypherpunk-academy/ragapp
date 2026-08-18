import { getSupabase } from '@/data/lib/supabase';

/** Fire-and-forget click counter for starter prompts (server-side analytics). */
export const starterPromptService = {
  incrementClick(id: string): void {
    if (!id || id.startsWith('fallback-')) return;
    void (async () => {
      try {
        const { error } = await getSupabase().rpc('increment_starter_prompt_click', { prompt_id: id });
        if (error) console.warn('[starterPrompt] incrementClick failed:', error.message);
      } catch (e: unknown) {
        console.warn('[starterPrompt] incrementClick failed:', e instanceof Error ? e.message : e);
      }
    })();
  },
};
