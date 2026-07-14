import {
  buildSearchHitCard,
  parseDateFromSegmentTitle,
  resolveLectureDisplayDate,
  resolveSummaryReadTarget,
} from '@/shared/lib/searchHitCard';
import type { SearchResult } from '@/shared/types/ragrun';

function quoteResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    chunk_id: 'quote-chunk',
    source_id: 'book-uuid:quotes',
    snippet: 'Steiner-Zitat',
    score: 0.9,
    chunk_type: 'quote',
    author: 'Rudolf Steiner',
    book_title: 'Allgemeine Menschenkunde',
    quote_text: '– Gefühl ist sowohl noch nicht ganz gewordene Erkenntnis',
    ...overrides,
  };
}

describe('buildSearchHitCard zitat', () => {
  it('uses full_quote body and none navigation without paragraph_id', () => {
    const model = buildSearchHitCard(quoteResult(), 'zitat');
    expect(model.card.bodyMode).toBe('full_quote');
    expect(model.card.bodyText).toContain('Gefühl');
    expect(model.navigation).toEqual({ kind: 'none' });
  });

  it('navigates to read when paragraph_id is set', () => {
    const model = buildSearchHitCard(
      quoteResult({ source_id: 'book-uuid', paragraph_id: 'para-uuid' }),
      'zitat',
    );
    expect(model.navigation).toEqual({
      kind: 'read',
      sourceId: 'book-uuid',
      paragraphId: 'para-uuid',
      segmentIndex: null,
    });
  });
});

function summaryResult(overrides: Partial<SearchResult> = {}): SearchResult {
  return {
    chunk_id: 'chunk-1',
    source_id: 'book-uuid:summary',
    snippet: 'Kurztext',
    score: 0.9,
    chunk_type: 'chapter_summary',
    ...overrides,
  };
}

describe('buildSearchHitCard kapitel_zusammenfassung', () => {
  it('shows author and book title in meta line, chapter in headline', () => {
    const model = buildSearchHitCard(
      summaryResult({
        author: 'Julian Assange',
        book_title: 'Julian Assange in his own words',
        title: 'Julian Assange in his own words',
        segment_title: 'ACKNOWLEDGMENTS',
        source_type: 'book',
      }),
      'kapitel_zusammenfassung',
    );
    expect(model.card.metaSmall).toBe('Julian Assange, Julian Assange in his own words');
    expect(model.card.headlineLarge).toBe('ACKNOWLEDGMENTS');
  });

  it('does not duplicate segment title when book_title is missing in API payload', () => {
    const model = buildSearchHitCard(
      summaryResult({
        author: 'Julian Assange',
        title: 'ACKNOWLEDGMENTS',
        segment_title: 'ACKNOWLEDGMENTS',
        source_type: 'book',
      }),
      'kapitel_zusammenfassung',
    );
    expect(model.card.metaSmall).toBe('Julian Assange');
    expect(model.card.headlineLarge).toBe('ACKNOWLEDGMENTS');
  });

  it('shows lecture segment title as headline with author and band in meta', () => {
    const model = buildSearchHitCard(
      summaryResult({
        author: 'Rudolf Steiner',
        book_title: 'Anthroposophie soziale Dreigliederung und Redekunst.',
        source_type: 'lecture',
        venue: 'Dornach',
        lecture_date: '1913-10-13',
        segment_title: 'Erster Vortrag',
      }),
      'kapitel_zusammenfassung',
    );
    expect(model.card.metaSmall).toBe(
      'Rudolf Steiner, Anthroposophie soziale Dreigliederung und Redekunst.',
    );
    expect(model.card.headlineLarge).toBe('Erster Vortrag');
    expect(model.card.subHeadSmall).toBeUndefined();
  });

  it('includes readTarget for book summary overlay navigation', () => {
    const model = buildSearchHitCard(
      summaryResult({
        source_id: 'book-uuid:summary',
        parent_id: 'book-uuid',
        source_index: 3,
        source_type: 'book',
        segment_title: 'V. ANHANG <i>An das deutsche Volk und an die Kulturwelt</i>!',
        text: 'Kapitel-Zusammenfassung',
      }),
      'kapitel_zusammenfassung',
    );
    expect(model.card.headlineLarge).toBe(
      'V. ANHANG <i>An das deutsche Volk und an die Kulturwelt</i>!',
    );
    expect(model.navigation).toMatchObject({
      kind: 'overlay',
      readTarget: { sourceId: 'book-uuid', segmentIndex: 2 },
    });
  });

  it('includes readTarget for lecture summary with band segment_index', () => {
    const model = buildSearchHitCard(
      summaryResult({
        source_id: '7879ca81-485f-5163-92c8-337d39ca904f:summary',
        parent_id: '7879ca81-485f-5163-92c8-337d39ca904f',
        source_index: 2,
        source_type: 'lecture',
        text: 'Vortrag-Zusammenfassung',
      }),
      'kapitel_zusammenfassung',
    );
    expect(model.navigation).toMatchObject({
      kind: 'overlay',
      readTarget: { sourceId: '7879ca81-485f-5163-92c8-337d39ca904f', segmentIndex: 1 },
    });
  });

  it('prefers lecture UUID over band parent_id for GA lecture summaries', () => {
    expect(
      resolveSummaryReadTarget(
        summaryResult({
          source_id: 'd9e44f3a-828f-50d5-8089-7e0f0461313f:summary',
          parent_id: '2f5760e1-2dd1-4df7-b8c8-b215bedb5509',
          source_index: 2,
          source_type: 'lecture',
          segment_title: 'ERSTER VORTRAG Stuttgart, 12. Februar 1921',
        }),
      ),
    ).toEqual({
      sourceId: 'd9e44f3a-828f-50d5-8089-7e0f0461313f',
      segmentIndex: 1,
    });
  });

  it('maps GA338 second lecture summary to segment_index 2 (19210213a)', () => {
    expect(
      resolveSummaryReadTarget(
        summaryResult({
          source_id: '94678119-0fb1-562c-be68-b9ed02cbdf30:summary',
          parent_id: '94678119-0fb1-562c-be68-b9ed02cbdf30',
          source_index: 3,
          source_type: 'lecture',
          segment_title: 'ZWEITER VORTRAG Stuttgart, 13. Februar 2021 (nachmittags)',
        }),
      ),
    ).toEqual({
      sourceId: '94678119-0fb1-562c-be68-b9ed02cbdf30',
      segmentIndex: 2,
    });
  });
});

describe('resolveSummaryReadTarget', () => {
  it('strips :summary suffix when parent_id is missing', () => {
    expect(
      resolveSummaryReadTarget(
        summaryResult({ source_id: 'book-uuid:summary', source_index: 1, source_type: 'book' }),
      ),
    ).toEqual({ sourceId: 'book-uuid', segmentIndex: 0 });
  });

  it('maps 1-based chapter index to 0-based segment_index (GA 31 Mommsen)', () => {
    expect(
      resolveSummaryReadTarget(
        summaryResult({
          source_id: 'ga31:summary',
          parent_id: 'ga31',
          source_index: 23,
          source_type: 'book',
          segment_title: 'THEODOR MOMMSENS BRIEF AN DIE DEUTSCHEN ÖSTERREICHS',
        }),
      ),
    ).toEqual({ sourceId: 'ga31', segmentIndex: 22 });
  });
});

describe('buildSearchHitCard chunk_vortrag', () => {
  it('uses phase5 H1 as headline and catalog vortragstitel as subHead (GA 332a)', () => {
    const model = buildSearchHitCard(
      {
        chunk_id: 'chunk-332a-2',
        source_id: '7879ca81-485f-5163-92c8-337d39ca904f',
        snippet: '1| Preisgestaltung',
        score: 0.9,
        chunk_type: 'book',
        source_type: 'lecture',
        author: 'Rudolf Steiner',
        book_title: 'Soziale Zukunft',
        venue: 'Zürich',
        lecture_date: '1919-10-25',
        segment_title: 'ZWEITER VORTRAG Zürich, 25. Oktober 1919',
        vortragstitel:
          'Das Wirtschaften auf assoziativer Grundlage. Die Umwandlung des Marktes. Preisgestaltung. Geld- und Steuerwesen. Kredit',
        paragraph_id: 'para-1',
      },
      'chunk_vortrag',
    );
    expect(model.card.headlineLarge).toBe('ZWEITER VORTRAG Zürich, 25. Oktober 1919');
    expect(model.card.subHeadSmall).toContain('Preisgestaltung');
    expect(model.card.metaSmall).toContain('Rudolf Steiner');
  });

  it('uses phase5 segment title as headline (GA 339 zweiter Vortrag)', () => {
    const model = buildSearchHitCard(
      {
        chunk_id: 'chunk-339-2',
        source_id: '82dc684d-fbe4-5ecc-934d-37e615b1a209',
        snippet: '1| Wenn wir heute darangehen',
        score: 0.9,
        chunk_type: 'book',
        source_type: 'lecture',
        author: 'Rudolf Steiner',
        book_title: 'Anthroposophie soziale Dreigliederung und Redekunst.',
        venue: 'Dornach',
        lecture_date: '1921-10-11',
        segment_title: 'ZWEITER VORTRAG Dornach, 12. Oktober 1921',
        paragraph_id: 'para-1',
      },
      'chunk_vortrag',
    );
    expect(model.card.headlineLarge).toBe('ZWEITER VORTRAG Dornach, 12. Oktober 1921');
    expect(model.card.subHeadSmall).toBeUndefined();
    expect(model.card.metaSmall).toContain('Rudolf Steiner');
  });
});

describe('lecture display date helpers', () => {
  it('parses German long date from segment title', () => {
    expect(parseDateFromSegmentTitle('ZWEITER VORTRAG Dornach, 12. Oktober 1921')).toBe(
      '1921-10-12',
    );
  });

  it('prefers segment title date when lecture_date conflicts', () => {
    expect(
      resolveLectureDisplayDate('ZWEITER VORTRAG Dornach, 12. Oktober 1921', '1921-10-11'),
    ).toBe('1921-10-12');
  });
});
