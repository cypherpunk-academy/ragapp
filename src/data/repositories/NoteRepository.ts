/**
 * Notes repository — all writes go through Supabase RPC functions
 * (create_note, save_note, delete_note, undelete_note).
 * Reads use the standard Supabase client with RLS.
 */
import { getSupabase } from '../lib/supabase';

export type NoteRow = {
  id: string;
  user_id: string;
  paragraph_id: string | null;
  segment_slug: string | null;
  source_id: string | null;
  title: string | null;
  content: string;
  text_type: string;
  status: string;
  version: number;
  conversation_url: string | null;
  created_by: string;
  is_public: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type NoteVersionRow = {
  id: string;
  note_id: string;
  version: number;
  title: string | null;
  content: string;
  status: string | null;
  changed_by: string;
  created_at: string;
};

type RpcResult = { ok?: boolean; error?: string; [key: string]: unknown };

export type SaveResult =
  | { ok: true; new_version: number }
  | { conflict: true; current_version: number; current_content: string; current_title: string | null }
  | { error: string };

export type CreateResult =
  | { ok: true; id: string; version: number }
  | { error: string };

function generateId(): string {
  // Simple UUID v4
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export const NoteRepository = {
  async get(id: string): Promise<NoteRow | null> {
    const { data, error } = await getSupabase()
      .from('app_notes')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async list(filter?: { sourceId?: string; segmentSlug?: string; paragraphId?: string }): Promise<NoteRow[]> {
    let query = getSupabase()
      .from('app_notes')
      .select('*')
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });

    if (filter?.sourceId) query = query.eq('source_id', filter.sourceId);
    if (filter?.segmentSlug) query = query.eq('segment_slug', filter.segmentSlug);
    if (filter?.paragraphId) query = query.eq('paragraph_id', filter.paragraphId);

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  },

  async listDeleted(): Promise<NoteRow[]> {
    const { data, error } = await getSupabase()
      .from('app_notes')
      .select('*')
      .not('deleted_at', 'is', null)
      .order('deleted_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(params: {
    title: string;
    content: string;
    textType?: string;
    paragraphId?: string;
    conversationUrl?: string;
    createdBy?: string;
  }): Promise<CreateResult> {
    const id = generateId();
    const { data, error } = await getSupabase().rpc('create_note', {
      p_id: id,
      p_title: params.title,
      p_content: params.content,
      p_text_type: params.textType ?? 'note',
      p_paragraph_id: params.paragraphId ?? null,
      p_conversation_url: params.conversationUrl ?? null,
      p_created_by: params.createdBy ?? 'user',
    });
    if (error) throw error;
    const result = data as RpcResult;
    if (result.error) return { error: result.error as string };
    return { ok: true, id: result.id as string, version: result.version as number };
  },

  async save(
    id: string,
    content: string,
    expectedVersion: number,
    changedBy?: string,
    title?: string,
    status?: string,
  ): Promise<SaveResult> {
    const { data, error } = await getSupabase().rpc('save_note', {
      p_id: id,
      p_content: content,
      p_expected_version: expectedVersion,
      p_changed_by: changedBy ?? 'user',
      p_title: title ?? null,
      p_status: status ?? null,
    });
    if (error) throw error;
    const result = data as RpcResult;
    if (result.error === 'conflict') {
      return {
        conflict: true,
        current_version: result.current_version as number,
        current_content: result.current_content as string,
        current_title: (result.current_title as string | null) ?? null,
      };
    }
    if (result.error) return { error: result.error as string };
    return { ok: true, new_version: result.new_version as number };
  },

  async delete(id: string): Promise<{ ok: boolean; error?: string }> {
    const { data, error } = await getSupabase().rpc('delete_note', { p_id: id });
    if (error) throw error;
    const result = data as RpcResult;
    if (result.error) return { ok: false, error: result.error as string };
    return { ok: true };
  },

  async undelete(id: string): Promise<{ ok: boolean; error?: string }> {
    const { data, error } = await getSupabase().rpc('undelete_note', { p_id: id });
    if (error) throw error;
    const result = data as RpcResult;
    if (result.error) return { ok: false, error: result.error as string };
    return { ok: true };
  },

  async history(noteId: string): Promise<NoteVersionRow[]> {
    const { data, error } = await getSupabase()
      .from('app_note_versions')
      .select('*')
      .eq('note_id', noteId)
      .order('version', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },
};
