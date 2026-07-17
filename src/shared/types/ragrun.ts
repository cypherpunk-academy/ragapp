export type SearchResult = {
  chunk_id: string;
  source_id: string;
  segment_id?: string;
  paragraph_id?: string;
  /** Quell-Titel (Werktitel oder Vortragstitel) */
  title?: string;
  /** Kapitel- oder Segment-Titel */
  segment_title?: string;
  snippet: string;
  /** Volltext des Chunks (wenn die Suche ihn mitliefert) — für Karten-Vorschau & Overlay. */
  text?: string;
  score: number;
  /** Chunk-Typ aus ragrun, z. B. 'text' | 'concept' | 'quote' | 'chapter_summary' */
  chunk_type?: string;
  /** Quellentyp, z. B. 'buch' | 'vortrag' | 'gespraech' */
  source_type?: string;
  /** Werk-/Quell-Autor (Kontextzeile bei Notiz) */
  author?: string;
  /** Buchtitel der Quelle (Kontextzeile bei Notiz, Buch) */
  book_title?: string;
  /** Vortrag: Ort (Kontextzeile bei Notiz) */
  venue?: string;
  /** Vortrag: Datum (ISO oder Anzeige-String) */
  lecture_date?: string;
  /** Vortrag: Katalog-Thementitel (unter H1 auf der Karte) */
  vortragstitel?: string;
  /** Notiz: Autor der Notiz (Zeile 2, fett) */
  note_author?: string;
  /** Notiz: Datum der Notiz — ISO oder Anzeige (Zeile 2, fett) */
  note_date?: string;
  /** Zitat: Autorenzeile (groß) */
  quote_author?: string;
  /** Zitat: voller Zitattext (Kartenkörper); fallback `snippet` */
  quote_text?: string;
  /** Leseposition / Folge-Laden (optional) */
  source_index?: number;
  /** Kapitelindex innerhalb der Quelle (Summaries) */
  segment_index?: number;
  /** Body-Quelle bei `:summary`-Chunks (parent_id aus Ingest) */
  parent_id?: string;
  /** Zitat: kapitel-lokale Absatznummer aus Quote-Metadaten */
  paragraph_number?: number;
  /** Zitat: Zeichenbereich im Absatz-text_raw (Start inkl., Ende exkl.) */
  quote_span?: { start: number; end: number };
  /** Zitat: Wortlaut im referenzierten Absatz gefunden */
  quote_verified?: boolean;
  /** Set when paragraph navigation is unavailable for this hit. */
  navigation_error?: string;
  /** Mehr-Chunk-Overlay (optional, Phase 2) */
  chunk_ids?: string[];
};

export type SearchRequest = {
  query: string;
  types?: string[];
  limit?: number;
  collection?: string;
};

export type SearchResponse = {
  results: SearchResult[];
};

/** Optional: `GET /app/chunks/{chunk_id}` — Volltext nachladen. */
export type ChunkTextResponse = {
  chunk_id: string;
  source_id?: string;
  text?: string;
  snippet?: string;
};

export type RagrunHealthResponse = {
  status: string;
  online?: boolean;
};

export type Personality = {
  slug: string;
  display_name: string;
  avatar_url?: string;
};

export type PersonalitiesResponse = {
  personalities: Personality[];
};

export type SourceSummary = {
  source_id: string;
  display_name: string;
  source_type?: string;
};

export type SourcesResponse = {
  sources: SourceSummary[];
};

export type SegmentSummary = {
  segment_id: string;
  segment_index: number;
  title: string;
};

export type SegmentsResponse = {
  segments: SegmentSummary[];
};

export type ChatContextMode = 'free' | 'paragraph' | 'segment';

export type ChatContextIds = {
  paragraph_id?: string;
  source_id?: string;
  segment_id?: string;
  note_id?: string;
};

/** Filo §7.2: `chat` → `thinking.type` disabled, `nachdenken` → enabled. */
export type ChatMode = 'chat' | 'nachdenken';

export type ChatRequest = {
  message: string;
  personality: string;
  talk_id?: string;
  mode?: ChatMode;
  model?: string;
  context_mode?: ChatContextMode;
  context_ids?: ChatContextIds;
};

export type ChatResponse = {
  talk_id: string;
  turn_id: string;
  reply: string;
};

export type ChatSummarizeResponse = {
  summary: string;
};

/** Contract §5 — Zitat aus `assistant_chat_graph.attach_citations`. */
export type ChatCitation = {
  chunk_id: string;
  /** Literale [N]-Markernummer aus dem Antworttext (fehlt bei Legacy-Fallback ohne Marker). */
  index?: number;
  source_id?: string;
  source_title?: string;
  segment_title?: string;
  segment_index?: number;
  lecture_date?: string;
  chunk_type?: string;
  source_type?: string;
  author?: string;
  book_title?: string;
  venue?: string;
  vortragstitel?: string;
  paragraph_id?: string;
  text?: string;
  score?: number;
};

export type ChatUsage = {
  model?: string;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
};

/** `POST /app/chat/stream` SSE-Events (Contract §5–6). */
export type ChatStreamEvent =
  | { type: 'status'; step: string; label: string }
  | { type: 'thinking'; content: string }
  | { type: 'token'; content: string }
  | {
      type: 'done';
      turn_id: string;
      talk_id: string;
      usage: ChatUsage | null;
      assistant_message: string;
      citations: ChatCitation[];
      confidence_score: number;
      intent: string;
      sufficiency: string;
      tool_results: unknown[];
    }
  | { type: 'error'; message: string };
