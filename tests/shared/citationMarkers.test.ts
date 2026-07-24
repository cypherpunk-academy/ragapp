import {
  extractCitedIndices,
  countUniqueCitations,
  splitTextWithCitations,
} from '@/shared/lib/citationMarkers';
import { citationIndexToListIndex, ensureOneBasedCitationIndices } from '@/shared/lib/ragHits';
import type { RagHit } from '@/shared/lib/ragHits';

describe('citationMarkers', () => {
  it('extracts unique indices', () => {
    expect(extractCitedIndices('Siehe [1] und [2][1].')).toEqual(new Set([1, 2]));
    expect(countUniqueCitations('Siehe [1] und [2][1].')).toBe(2);
  });

  it('splits text and citations', () => {
    const segs = splitTextWithCitations('Text [1] mehr.');
    expect(segs).toEqual([
      { kind: 'text', value: 'Text ' },
      { kind: 'citation', value: '[1]', index: 1 },
      { kind: 'text', value: ' mehr.' },
    ]);
  });
});

describe('citationIndexToListIndex', () => {
  const hits: RagHit[] = [
    { chunk_id: 'a', source_id: 's', snippet: '', score: 0, citationIndex: 2 },
    { chunk_id: 'b', source_id: 's', snippet: '', score: 0, citationIndex: 5 },
  ];

  it('maps by citationIndex field', () => {
    expect(citationIndexToListIndex(5, hits)).toBe(1);
  });

  it('falls back to 1-based position', () => {
    expect(citationIndexToListIndex(1, hits)).toBe(0);
  });
});

describe('ensureOneBasedCitationIndices', () => {
  it('shifts 0-based indices to 1-based', () => {
    const hits: RagHit[] = [
      { chunk_id: 'a', source_id: 's', snippet: '', score: 0, citationIndex: 0 },
      { chunk_id: 'b', source_id: 's', snippet: '', score: 0, citationIndex: 1 },
    ];
    expect(ensureOneBasedCitationIndices(hits).map((h) => h.citationIndex)).toEqual([1, 2]);
  });

  it('leaves already 1-based indices unchanged', () => {
    const hits: RagHit[] = [
      { chunk_id: 'a', source_id: 's', snippet: '', score: 0, citationIndex: 1 },
      { chunk_id: 'b', source_id: 's', snippet: '', score: 0, citationIndex: 2 },
    ];
    expect(ensureOneBasedCitationIndices(hits).map((h) => h.citationIndex)).toEqual([1, 2]);
  });
});
