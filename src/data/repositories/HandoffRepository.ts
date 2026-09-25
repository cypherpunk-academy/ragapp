/**
 * Handoff repository — short-lived transfer objects between App and Claude.
 * IDs are generated server-side by create_handoff() RPC.
 */
import { getSupabase } from '../lib/supabase';

export type HandoffRow = {
  id: string;
  user_id: string;
  paragraph_id: string | null;
  source_id: string | null;
  segment_slug: string | null;
  marked_text: string | null;
  user_question: string | null;
  return_url: string | null;
  created_at: string;
  expires_at: string;
};

type RpcResult = { ok?: boolean; error?: string; id?: string };

export const HandoffRepository = {
  async create(params: {
    paragraphId?: string;
    sourceId?: string;
    segmentSlug?: string;
    markedText?: string;
    userQuestion?: string;
    returnUrl?: string;
  }): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
    const { data, error } = await getSupabase().rpc('create_handoff', {
      p_paragraph_id: params.paragraphId ?? null,
      p_source_id: params.sourceId ?? null,
      p_segment_slug: params.segmentSlug ?? null,
      p_marked_text: params.markedText ?? null,
      p_user_question: params.userQuestion ?? null,
      p_return_url: params.returnUrl ?? null,
    });
    if (error) throw error;
    const result = data as RpcResult;
    if (result.error) return { ok: false, error: result.error };
    return { ok: true, id: result.id as string };
  },

  async get(id: string): Promise<HandoffRow | null> {
    const { data, error } = await getSupabase()
      .from('handoffs')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
