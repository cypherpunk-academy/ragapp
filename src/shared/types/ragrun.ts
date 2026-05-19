export type SearchResult = {
  chunk_id: string;
  source_id: string;
  segment_id?: string;
  paragraph_id?: string;
  snippet: string;
  score: number;
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
