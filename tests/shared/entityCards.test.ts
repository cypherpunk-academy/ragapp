import { entityKindFromSearchResult } from '@/shared/theme/entityCards';

describe('entityKindFromSearchResult', () => {
  it('maps quote_explanation to zitat', () => {
    expect(entityKindFromSearchResult({ chunk_type: 'quote_explanation' })).toBe('zitat');
  });

  it('maps quote to zitat', () => {
    expect(entityKindFromSearchResult({ chunk_type: 'quote' })).toBe('zitat');
  });

  it('falls back to chunk_buch for unknown book chunks', () => {
    expect(entityKindFromSearchResult({ chunk_type: 'book', source_type: 'book' })).toBe('chunk_buch');
  });
});
