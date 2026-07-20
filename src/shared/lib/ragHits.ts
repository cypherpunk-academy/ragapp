import type Reference from '@/data/db/models/Reference';
import type Turn from '@/data/db/models/Turn';
import type { SearchResult } from '@/shared/types/ragrun';

export type RagHit = SearchResult & { citationIndex?: number };

/** Eintrag aus `turns.chunk_index_map` (KI-Suche-Treffer der Anfrage). */
export type ChunkIndexEntry = {
  index?: number;
  chunk_id: string;
  text?: string;
  source_title?: string;
  segment_title?: string;
  source_id?: string;
  chunk_type?: string;
  source_type?: string;
  author?: string;
  book_title?: string;
  paragraph_id?: string;
  segment_index?: number;
  lecture_date?: string;
  score?: number;
  slot?: string;
};

export function parseChunkIndexMap(raw: string | null | undefined): ChunkIndexEntry[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ChunkIndexEntry =>
        typeof e === 'object' && e != null && typeof (e as ChunkIndexEntry).chunk_id === 'string',
    );
  } catch {
    return [];
  }
}

export function chunkIndexEntryToSearchResult(entry: ChunkIndexEntry): RagHit {
  const text = entry.text?.trim() ?? '';
  return {
    chunk_id: entry.chunk_id,
    source_id: entry.source_id?.trim() ?? '',
    title: entry.source_title?.trim() || entry.book_title?.trim() || undefined,
    segment_title: entry.segment_title?.trim() || undefined,
    snippet: text.slice(0, 280) || entry.segment_title?.trim() || entry.source_title?.trim() || '',
    text: text || undefined,
    score: typeof entry.score === 'number' ? entry.score : 0,
    chunk_type: entry.chunk_type,
    source_type: entry.source_type,
    author: entry.author,
    book_title: entry.book_title,
    paragraph_id: entry.paragraph_id,
    segment_index: entry.segment_index,
    lecture_date: entry.lecture_date,
    citationIndex: typeof entry.index === 'number' ? entry.index : undefined,
  };
}

export function referenceToSearchResult(ref: Reference): RagHit {
  const title = ref.sourceTitle?.trim() || undefined;
  const segment = ref.segmentTitle?.trim() || undefined;
  return {
    chunk_id: ref.chunkId?.trim() ?? '',
    source_id: '',
    title,
    segment_title: segment,
    snippet: segment ?? title ?? '',
    score: typeof ref.relevance === 'number' ? ref.relevance : 0,
    citationIndex: typeof ref.refIndex === 'number' ? ref.refIndex : undefined,
  };
}

/**
 * Alle RAG-Treffer eines Turns: bevorzugt `chunk_index_map` (volle Qdrant-Liste),
 * sonst normalisierte `references` aus dem Sync.
 */
export function resolveRagHitsForTurn(turn: Turn, references: Reference[]): RagHit[] {
  const fromMap = parseChunkIndexMap(turn.chunkIndexMap).map(chunkIndexEntryToSearchResult);
  if (fromMap.length > 0) return fromMap;

  return references
    .filter((r) => Boolean(r.chunkId?.trim()))
    .map(referenceToSearchResult);
}

/** Listet `[N]`-Index auf FlatList-Position (0-basiert). */
export function citationIndexToListIndex(
  citationIndex: number,
  hits: RagHit[],
): number {
  const byIndex = hits.findIndex((h) => h.citationIndex === citationIndex);
  if (byIndex >= 0) return byIndex;
  if (citationIndex >= 1 && citationIndex <= hits.length) return citationIndex - 1;
  return 0;
}

export type TurnUsageMeta = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  model?: string;
  cost_eur?: number;
};

export function parseTurnUsage(raw: string | null | undefined): TurnUsageMeta | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as TurnUsageMeta;
    return typeof parsed === 'object' && parsed != null ? parsed : null;
  } catch {
    return null;
  }
}

export function formatTurnUsageLine(usage: TurnUsageMeta | null): string | null {
  if (!usage) return null;
  const parts: string[] = [];
  if (typeof usage.total_tokens === 'number') {
    parts.push(`GESAMT ${usage.total_tokens.toLocaleString('de-DE')} TOKENS`);
  }
  if (usage.model?.trim()) {
    parts.push(usage.model.trim().toUpperCase());
  }
  if (typeof usage.cost_eur === 'number' && usage.cost_eur > 0) {
    parts.push(`EUR ${usage.cost_eur.toFixed(5).replace('.', ',')}`);
  }
  return parts.length > 0 ? parts.join(' · ') : null;
}
