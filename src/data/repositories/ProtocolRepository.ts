/**
 * Protocol repository — one protocol per chapter (source + segment_slug).
 * Entries are appended via standard Supabase insert.
 */
import { getSupabase } from '../lib/supabase';

export type ProtocolRow = {
  id: string;
  user_id: string;
  source_id: string;
  segment_slug: string;
  created_at: string;
  updated_at: string;
};

export type ProtocolEntryRow = {
  id: string;
  protocol_id: string;
  paragraph_id: string | null;
  entry_type: string;
  content: string;
  conversation_url: string | null;
  created_at: string;
};

export const ProtocolRepository = {
  async getOrCreate(sourceId: string, segmentSlug: string): Promise<ProtocolRow> {
    const sb = getSupabase();

    // Try to find existing
    const { data: existing } = await sb
      .from('protocols')
      .select('*')
      .eq('source_id', sourceId)
      .eq('segment_slug', segmentSlug)
      .maybeSingle();

    if (existing) return existing;

    // Create new
    const { data, error } = await sb
      .from('protocols')
      .insert({ source_id: sourceId, segment_slug: segmentSlug })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async append(
    protocolId: string,
    entry: {
      entryType: string;
      content: string;
      paragraphId?: string;
      conversationUrl?: string;
    },
  ): Promise<ProtocolEntryRow> {
    const { data, error } = await getSupabase()
      .from('protocol_entries')
      .insert({
        protocol_id: protocolId,
        entry_type: entry.entryType,
        content: entry.content,
        paragraph_id: entry.paragraphId ?? null,
        conversation_url: entry.conversationUrl ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async list(sourceId: string, segmentSlug: string): Promise<ProtocolEntryRow[]> {
    const sb = getSupabase();

    const { data: protocol } = await sb
      .from('protocols')
      .select('id')
      .eq('source_id', sourceId)
      .eq('segment_slug', segmentSlug)
      .maybeSingle();

    if (!protocol) return [];

    const { data, error } = await sb
      .from('protocol_entries')
      .select('*')
      .eq('protocol_id', protocol.id)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async listForParagraph(paragraphId: string): Promise<ProtocolEntryRow[]> {
    const { data, error } = await getSupabase()
      .from('protocol_entries')
      .select('*')
      .eq('paragraph_id', paragraphId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },
};
