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
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  }
  return s;
}

function joinMeta(parts: (string | undefined)[]): string | undefined {
  const xs = parts.filter((p): p is string => Boolean(p && p.trim()));
  if (xs.length === 0) return undefined;
  return xs.join(', ');
}

/** Anfang Chunk-Text für Karte/Overlay: API `text`, sonst `snippet`. */
export function chunkPreviewText(r: SearchResult): string {
  return (r.text ?? r.snippet ?? '').trim();
}

function isVortragSource(r: SearchResult): boolean {
  const st = r.source_type?.toLowerCase() ?? '';
  return st === 'vortrag' || st === 'lecture';
}

export type SearchHitNavigation =
  | { kind: 'read'; sourceId: string; paragraphId: string }
  | {
      kind: 'overlay';
      sourceId: string;
      chunkId: string;
      title?: string | null;
      /** Volltext bevorzugt aus `result.text`, sonst Snippet. */
      initialText: string;
    }
  | { kind: 'none' };

export type SearchHitCardBodyMode = 'truncated_text' | 'full_quote';

export type SearchHitCardModel = {
  card: {
    metaSmall?: string;
    headlineLarge?: string;
    notizRows?: ReturnType<typeof buildNotizCardRows>;
    bodyMode: SearchHitCardBodyMode;
    bodyText: string;
  };
  navigation: SearchHitNavigation;
};

/**
 * Mappt Suchtreffer + EntityKind auf Kartenlayout und Navigation (Lesen vs. Chunk-Overlay).
 * Fehlende API-Felder: sinnvolle Fallbacks aus title/segment_title/snippet (bis Backend nachzieht).
 */
export function buildSearchHitCard(result: SearchResult, kind: EntityKind): SearchHitCardModel {
  const preview = chunkPreviewText(result);
  const readNav = (): SearchHitNavigation =>
    result.paragraph_id
      ? { kind: 'read', sourceId: result.source_id, paragraphId: result.paragraph_id }
      : { kind: 'none' };

  const overlayNav = (title?: string | null): SearchHitNavigation => {
    const initial = (result.text ?? result.snippet ?? '').trim();
    if (!initial) return { kind: 'none' };
    return {
      kind: 'overlay',
      sourceId: result.source_id,
      chunkId: result.chunk_id,
      title: title ?? result.title ?? result.segment_title,
      initialText: initial,
    };
  };

  switch (kind) {
    case 'chunk_buch': {
      const bookTitle = (result.book_title ?? result.title)?.trim();
      const metaSmall = joinMeta([result.author?.trim(), bookTitle]);
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
      const metaSmall = joinMeta([
        result.author?.trim(),
        result.venue?.trim(),
        formatMetaDate(result.lecture_date),
      ]);
      const headlineLarge = result.title?.trim() || result.segment_title?.trim() || result.source_id;
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
    case 'kapitel_zusammenfassung': {
      const vortrag = isVortragSource(result);
      const metaSmall = vortrag
        ? joinMeta([result.author?.trim(), result.venue?.trim(), formatMetaDate(result.lecture_date)])
        : joinMeta([result.author?.trim(), (result.book_title ?? result.title)?.trim()]);
      const headlineLarge = vortrag
        ? (result.title?.trim() || result.segment_title?.trim() || result.source_id)
        : (result.segment_title?.trim() || result.title?.trim() || result.source_id);
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
    case 'begriff': {
      const headlineLarge =
        result.title?.trim() || result.segment_title?.trim() || result.source_id;
      return {
        card: {
          headlineLarge,
          bodyMode: 'truncated_text',
          bodyText: preview,
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
        navigation: readNav(),
      };
    }
    case 'typology': {
      const headlineLarge = result.title?.trim() || result.segment_title?.trim() || result.source_id;
      return {
        card: {
          headlineLarge,
          bodyMode: 'truncated_text',
          bodyText: preview,
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
