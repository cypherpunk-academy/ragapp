import { resolveRagHitsForTurn, parseChunkIndexMap, referenceToSearchResult } from '@/shared/lib/ragHits';
import type Turn from '@/data/db/models/Turn';
import type Reference from '@/data/db/models/Reference';

function makeTurn(chunkIndexMap: string | null): Turn {
  return { chunkIndexMap } as Turn;
}

function makeRef(overrides: Partial<Reference> = {}): Reference {
  return {
    turnId: 't1',
    chunkId: 'chunk-1',
    relevance: 0.8,
    sourceTitle: 'Philosophie der Freiheit',
    segmentTitle: 'Kapitel 1',
    refIndex: 1,
    ...overrides,
  } as Reference;
}

describe('parseChunkIndexMap', () => {
  it('parses valid JSON array', () => {
    const raw = JSON.stringify([
      { chunk_id: 'c1', text: 'Hallo', score: 0.9, source_title: 'Buch' },
    ]);
    expect(parseChunkIndexMap(raw)).toHaveLength(1);
    expect(parseChunkIndexMap(raw)[0]!.chunk_id).toBe('c1');
  });

  it('returns empty for invalid input', () => {
    expect(parseChunkIndexMap(null)).toEqual([]);
    expect(parseChunkIndexMap('not-json')).toEqual([]);
  });
});

describe('resolveRagHitsForTurn', () => {
  it('prefers chunk_index_map over references', () => {
    const turn = makeTurn(JSON.stringify([
      { chunk_id: 'from-map', text: 'Text', score: 0.7 },
    ]));
    const refs = [makeRef({ chunkId: 'from-ref' })];
    const hits = resolveRagHitsForTurn(turn, refs);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.chunk_id).toBe('from-map');
  });

  it('falls back to references when map is empty', () => {
    const turn = makeTurn(null);
    const refs = [makeRef()];
    const hits = resolveRagHitsForTurn(turn, refs);
    expect(hits).toHaveLength(1);
    expect(hits[0]!.chunk_id).toBe('chunk-1');
    expect(hits[0]!.title).toBe('Philosophie der Freiheit');
  });
});

describe('referenceToSearchResult', () => {
  it('maps minimal reference fields', () => {
    const r = referenceToSearchResult(makeRef({ relevance: 0.42 }));
    expect(r.score).toBe(0.42);
    expect(r.segment_title).toBe('Kapitel 1');
  });
});
