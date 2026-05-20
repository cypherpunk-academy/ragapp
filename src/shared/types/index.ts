// Shared TypeScript types

export type ParagraphAnnotations = {
  italics?: Array<{ start: number; end: number }>;
  foreign_quotes?: Array<{
    start: number;
    end: number;
    quoted_author?: string;
    quoted_work?: string;
  }>;
  page_refs?: Array<{
    start: number;
    end: number;
    anchor_id?: string;
    target_paragraph_id?: string;
  }>;
};

export type AstNode =
  | { type: 'paragraph'; index: number; children: AstInlineNode[] }
  | { type: 'heading'; level: number; content: string }
  | { type: 'quote'; children: AstInlineNode[] };

export type AstInlineNode =
  | { type: 'text'; content: string }
  | { type: 'italic'; content: string }
  | { type: 'footnote_ref'; content: string; ref_id: string };

export type {
  ChatContextIds,
  ChatContextMode,
  ChatRequest,
  ChatResponse,
  ChatSummarizeResponse,
  ChunkTextResponse,
  Personality,
  PersonalitiesResponse,
  RagrunHealthResponse,
  SearchRequest,
  SearchResponse,
  SearchResult,
  SegmentSummary,
  SegmentsResponse,
  SourceSummary,
  SourcesResponse,
} from './ragrun';
