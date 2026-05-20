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

export type ChatRequest = {
  message: string;
  personality: string;
  talk_id?: string;
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
