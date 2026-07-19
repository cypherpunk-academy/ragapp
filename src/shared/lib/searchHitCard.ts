import type { SearchResult } from '@/shared/types/ragrun';
import type { EntityKind } from '@/shared/theme/entityCards';
import {
  buildNotizCardRows,
  buildNotizSourceContextLine,
  notizBodyPreviewText,
} from '@/shared/lib/notizSearchCard';

/** ISO-Datum → de-DE Kurzdatum; sonst String durchreichen. */
function formatMetaDate(raw?: string): string | undefined {
  if (!raw?.trim()) return undefined;
  const s = raw.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (iso) {
    const d = new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
    }
  }
  return s;
}

function joinMeta(parts: (string | undefined)[]): string | undefined {
  const xs = parts.filter((p): p is string => Boolean(p && p.trim()));
  if (xs.length === 0) return undefined;
  return xs.join(', ');
}

const MONTH_NAMES: Record<string, number> = {
  januar: 1,
  februar: 2,
  märz: 3,
  april: 4,
  mai: 5,
  juni: 6,
  juli: 7,
  august: 8,
  september: 9,
  oktober: 10,
  november: 11,
  dezember: 12,
};

/** Parse `D. Monat YYYY` or `DD.MM.YYYY` from a segment/heading title → ISO `YYYY-MM-DD`. */
export function parseDateFromSegmentTitle(text?: string): string | undefined {
  if (!text?.trim()) return undefined;
  const s = text.trim();
  const digitsMatch = s.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (digitsMatch) {
    const d = digitsMatch[1]!.padStart(2, '0');
    const m = digitsMatch[2]!.padStart(2, '0');
    return `${digitsMatch[3]}-${m}-${d}`;
  }
  const monthMatch = s.match(
    /(\d{1,2})\.\s*(Januar|Februar|März|April|Mai|Juni|Juli|August|September|Oktober|November|Dezember)\s+(\d{4})/i,
  );
  if (monthMatch) {
    const monthNum = MONTH_NAMES[monthMatch[2]!.toLowerCase()];
    if (!monthNum) return undefined;
    const d = monthMatch[1]!.padStart(2, '0');
    const m = String(monthNum).padStart(2, '0');
    return `${monthMatch[3]}-${m}-${d}`;
  }
  return undefined;
}

/** Prefer phase5 heading date when it conflicts with catalog `lecture_date`. */
export function resolveLectureDisplayDate(
  segmentTitle?: string,
  lectureDate?: string,
): string | undefined {
  const fromTitle = parseDateFromSegmentTitle(segmentTitle);
  const fromMeta = lectureDate?.trim().match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  if (fromTitle && fromMeta && fromTitle !== fromMeta) return fromTitle;
  return fromTitle ?? fromMeta;
}

function buildVortragSearchCard(result: SearchResult): {
  metaSmall?: string;
  headlineLarge?: string;
  subHeadSmall?: string;
} {
  const segment = result.segment_title?.trim();
  const headlineLarge = segment || result.title?.trim() || result.source_id;
  const metaSmall = joinMeta([displayAuthor(result.author), resolveWorkTitle(result)]);
  const subHeadSmall = result.vortragstitel?.trim() || undefined;
  return { metaSmall, headlineLarge, subHeadSmall };
}

/** Anfang Chunk-Text für Karte/Overlay: API `text`, sonst `snippet`. */
export function chunkPreviewText(r: SearchResult): string {
  return (r.text ?? r.snippet ?? '').trim();
}

function isVortragSource(r: SearchResult): boolean {
  const st = r.source_type?.toLowerCase() ?? '';
  return st === 'vortrag' || st === 'lecture';
}

/** Augmentation assistant slug must not appear as work author on cards. */
function displayAuthor(author?: string): string | undefined {
  const a = author?.trim();
  if (!a) return undefined;
  const lower = a.toLowerCase();
  if (lower === 'philo-von-freisinn' || lower === 'philo von freisinn') return undefined;
  return a;
}

/** `title` from search API may equal segment_title when book_title was missing in ingest. */
function resolveWorkTitle(result: SearchResult): string | undefined {
  const bookTitle = result.book_title?.trim();
  if (bookTitle) return bookTitle;
  const title = result.title?.trim();
  const segment = result.segment_title?.trim();
  if (title && segment && title.toUpperCase() === segment.toUpperCase()) return undefined;
  return title;
}

export type SummaryReadTarget = {
  sourceId: string;
  segmentIndex: number | null;
};

export type SearchHitNavigation =
  | { kind: 'read'; sourceId: string; paragraphId: string | null; segmentIndex?: number | null; markerOffset?: number | null }
  | {
      kind: 'overlay';
      sourceId: string;
      chunkId: string;
      title?: string | null;
      /** Volltext bevorzugt aus `result.text`, sonst Snippet. */
      initialText: string;
      /** Zweiter Tap im Overlay: zum Kapitel-/Vortragsanfang springen. */
      readTarget?: SummaryReadTarget;
    }
  | { kind: 'none' };

/** Summary ingest stores 1-based chapter.index; rag_paragraphs use 0-based segment_index. */
export function summaryChapterIndexToSegmentIndex(chapterIndex: number): number {
  return Math.max(0, chapterIndex - 1);
}

/** Body-Quelle und Segment für Navigation aus Summary-Suchtreffer. */
export function resolveSummaryBodySourceId(result: SearchResult): string | undefined {
  const summarySourceId = result.source_id?.trim();
  if (!summarySourceId) return undefined;

  // Lecture summaries: parent_id is often the GA band book_id; paragraphs live under lecture UUID.
  if (isVortragSource(result) && summarySourceId.endsWith(':summary')) {
    return summarySourceId.slice(0, -':summary'.length);
  }

  return (
    result.parent_id?.trim()
    || (summarySourceId.endsWith(':summary')
      ? summarySourceId.slice(0, -':summary'.length)
      : summarySourceId)
  );
}

/** Zitate leben unter einer Pseudo-Quelle `{book_id}:quotes` (siehe `backfill_quote_paragraph.py`); Navigation braucht die reale Buch-/Vortrags-Quelle. */
export function resolveQuoteBodySourceId(result: SearchResult): string | undefined {
  const quoteSourceId = result.source_id?.trim();
  if (!quoteSourceId) return undefined;

  return (
    result.parent_id?.trim()
    || (quoteSourceId.endsWith(':quotes')
      ? quoteSourceId.slice(0, -':quotes'.length)
      : quoteSourceId)
  );
}

/** Body-Quelle und Segment für Navigation aus Summary-Suchtreffer. */
export function resolveSummaryReadTarget(result: SearchResult): SummaryReadTarget | undefined {
  const bodySourceId = resolveSummaryBodySourceId(result);
  if (!bodySourceId) return undefined;

  if (isVortragSource(result)) {
    // Body lives under lecture UUID, but rag_paragraphs.segment_index is still the
    // 0-based GA-band chapter index (same as books: source_index 1-based → segment - 1).
    const chapterIndex = result.source_index ?? result.segment_index;
    const segmentIndex =
      typeof chapterIndex === 'number' && Number.isFinite(chapterIndex)
        ? summaryChapterIndexToSegmentIndex(chapterIndex)
        : 0;
    return { sourceId: bodySourceId, segmentIndex };
  }

  const chapterIndex = result.source_index ?? result.segment_index;
  const segmentIndex =
    typeof chapterIndex === 'number' && Number.isFinite(chapterIndex)
      ? summaryChapterIndexToSegmentIndex(chapterIndex)
      : null;

  return { sourceId: bodySourceId, segmentIndex };
}

export type SearchHitCardBodyMode = 'truncated_text' | 'full_quote';

export type SearchHitCardModel = {
  card: {
    metaSmall?: string;
    headlineLarge?: string;
    subHeadSmall?: string;
    notizRows?: ReturnType<typeof buildNotizCardRows>;
    bodyMode: SearchHitCardBodyMode;
    bodyText: string;
    bodyMarkdown?: boolean;
  };
  navigation: SearchHitNavigation;
};

/**
 * Mappt Suchtreffer + EntityKind auf Kartenlayout und Navigation (Lesen vs. Chunk-Overlay).
 * Fehlende API-Felder: sinnvolle Fallbacks aus title/segment_title/snippet (bis Backend nachzieht).
 */
export function buildSearchHitCard(result: SearchResult, kind: EntityKind): SearchHitCardModel {
  const preview = chunkPreviewText(result);

  const readNav = (): SearchHitNavigation => {
    if (result.navigation_error) return { kind: 'none' };
    if (!result.paragraph_id?.trim()) return { kind: 'none' };
    return {
      kind: 'read',
      sourceId: result.source_id,
      paragraphId: result.paragraph_id,
      segmentIndex: result.source_index ?? null,
      markerOffset: null,
    };
  };

  const quoteReadNav = (): SearchHitNavigation => {
    if (result.navigation_error) return { kind: 'none' };
    if (!result.paragraph_id?.trim()) return { kind: 'none' };
    const sourceId = resolveQuoteBodySourceId(result);
    if (!sourceId) return { kind: 'none' };
    return {
      kind: 'read',
      sourceId,
      paragraphId: result.paragraph_id,
      segmentIndex: null,
      markerOffset: result.quote_span?.start ?? null,
    };
  };

  const overlayNav = (
    title?: string | null,
    readTarget?: SummaryReadTarget,
  ): SearchHitNavigation => {
    const initial = (result.text ?? result.snippet ?? '').trim();
    if (!initial) return { kind: 'none' };
    return {
      kind: 'overlay',
      sourceId: result.source_id,
      chunkId: result.chunk_id,
      title: title ?? result.title ?? result.segment_title,
      initialText: initial,
      readTarget,
    };
  };

  switch (kind) {
    case 'chunk_buch': {
      const bookTitle = (result.book_title ?? result.title)?.trim();
      const metaSmall = joinMeta([displayAuthor(result.author), bookTitle]);
      const headlineLarge =
        result.segment_title?.trim() || result.title?.trim() || result.source_id;
      return {
        card: {
          metaSmall,
          headlineLarge,
          bodyMode: 'truncated_text',
          bodyText: preview,
        },
        navigation: readNav(),
      };
    }
    case 'chunk_vortrag': {
      const { metaSmall, headlineLarge, subHeadSmall } = buildVortragSearchCard(result);
      return {
        card: {
          metaSmall,
          headlineLarge,
          subHeadSmall,
          bodyMode: 'truncated_text',
          bodyText: preview,
        },
        navigation: readNav(),
      };
    }
    case 'kapitel_zusammenfassung': {
      const vortrag = isVortragSource(result);
      let metaSmall: string | undefined;
      let headlineLarge: string | undefined;
      let subHeadSmall: string | undefined;
      if (vortrag) {
        ({ metaSmall, headlineLarge, subHeadSmall } = buildVortragSearchCard(result));
      } else {
        metaSmall = joinMeta([displayAuthor(result.author), resolveWorkTitle(result)]);
        headlineLarge =
          result.segment_title?.trim()
          || result.title?.trim()
          || result.source_id;
      }
      const chapterTitle = result.segment_title?.trim() || result.title?.trim() || result.source_id;
      return {
        card: {
          metaSmall,
          headlineLarge,
          subHeadSmall,
          bodyMode: 'truncated_text',
          bodyText: preview,
        },
        navigation: overlayNav(chapterTitle, resolveSummaryReadTarget(result)),
      };
    }
    case 'begriff': {
      const headlineLarge =
        result.segment_title?.trim() || result.title?.trim() || result.source_id;
      return {
        card: {
          headlineLarge,
          bodyMode: 'truncated_text',
          bodyText: preview,
          bodyMarkdown: true,
        },
        navigation: overlayNav(headlineLarge),
      };
    }
    case 'zitat': {
      /** Klein über dem Autor: Werktitel (API `book_title` oder Fallback `title`). */
      const metaSmall = (result.book_title ?? result.title)?.trim() || undefined;
      const headlineLarge =
        (result.quote_author ?? result.author)?.trim() || '—';
      const quoteBody = (result.quote_text ?? result.snippet ?? '').trim();
      return {
        card: {
          metaSmall,
          headlineLarge,
          bodyMode: 'full_quote',
          bodyText: quoteBody,
        },
        navigation: quoteReadNav(),
      };
    }
    case 'typology': {
      const headlineLarge = result.segment_title?.trim() || result.title?.trim() || result.source_id;
      return {
        card: {
          headlineLarge,
          bodyMode: 'truncated_text',
          bodyText: preview,
          bodyMarkdown: true,
        },
        navigation: overlayNav(headlineLarge),
      };
    }
    case 'chunk_gespraech': {
      const metaSmall = buildNotizSourceContextLine(result)?.trim() || undefined;
      const headlineLarge = result.title?.trim() || result.segment_title?.trim() || result.source_id;
      return {
        card: {
          metaSmall,
          headlineLarge,
          bodyMode: 'truncated_text',
          bodyText: preview,
        },
        navigation: overlayNav(headlineLarge),
      };
    }
    case 'notiz': {
      const rows = buildNotizCardRows(result);
      const body = notizBodyPreviewText(result);
      return {
        card: {
          notizRows: rows,
          bodyMode: 'truncated_text',
          bodyText: body,
        },
        navigation: body ? overlayNav(rows.titleLarge) : { kind: 'none' },
      };
    }
    case 'talk':
      // Lokale Talks: eigene TalkCard, nicht über diesen Mapper.
      return {
        card: { bodyMode: 'truncated_text', bodyText: '' },
        navigation: { kind: 'none' },
      };
    default: {
      const headlineLarge = result.title?.trim() || result.source_id;
      return {
        card: {
          headlineLarge,
          bodyMode: 'truncated_text',
          bodyText: preview,
        },
        navigation: readNav(),
      };
    }
  }
}
