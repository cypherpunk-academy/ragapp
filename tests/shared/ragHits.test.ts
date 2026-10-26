import { parseChunkIndexMap } from '@/shared/lib/ragHits';

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
