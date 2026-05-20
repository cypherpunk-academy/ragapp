import type { SearchResult } from '@/shared/types/ragrun';

/** ISO 8601 Datum (nur Datum) oder mit Zeit — für de-DE Kurzdatum. */
function formatDisplayDate(raw?: string): string | undefined {
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

function joinParts(parts: (string | undefined)[]): string | undefined {
  const xs = parts.filter((p): p is string => Boolean(p && p.trim()));
  if (xs.length === 0) return undefined;
  return xs.join(', ');
}

/**
 * Zeile 3 (klein): Quell-Kontext — wie Gespräch: Vortrag Autor+Ort+Datum, sonst Autor+Buchtitel.
 * Backend kann `author`, `book_title`, `venue`, `lecture_date` liefern; sonst Fallbacks aus title.
 */
export function buildNotizSourceContextLine(r: SearchResult): string | undefined {
  const st = r.source_type?.toLowerCase() ?? '';
  const author = r.author?.trim();
  const book = (r.book_title ?? r.title)?.trim();

  if (st === 'vortrag' || st === 'lecture') {
    const date = formatDisplayDate(r.lecture_date);
    return joinParts([author, r.venue?.trim(), date]);
  }

  if (st === 'buch' || st === 'book') {
    return joinParts([author, book]);
  }

  return joinParts([author, book]);
}

export type NotizCardRows = {
  /** Zeile 2: klein, fett — Autor der Notiz, Datum der Notiz */
  authorDateBold: string;
  /** Zeile 3: klein — optional Kontext */
  contextSmall?: string;
  /** Zeile 4: groß — Notiztitel */
  titleLarge: string;
};

/**
 * Baut die drei Inhaltszeilen für die Notiz-Suchkarte (ohne Typ-Zeile).
 * Fallbacks solange die API noch nicht alle Felder sendet.
 */
export function buildNotizCardRows(r: SearchResult): NotizCardRows {
  const noteAuthor = r.note_author?.trim();
  const noteDateDisplay = formatDisplayDate(r.note_date) ?? r.note_date?.trim();
  const authorDateBold =
    joinParts([noteAuthor, noteDateDisplay]) ?? 'Notiz';

  const contextSmall = buildNotizSourceContextLine(r);

  const titleLarge =
    (r.title?.trim() && r.title.trim()) ||
    (r.segment_title?.trim() && r.segment_title.trim()) ||
    r.source_id;

  return {
    authorDateBold,
    contextSmall: contextSmall?.trim() || undefined,
    titleLarge,
  };
}

export function notizBodyPreviewText(r: SearchResult): string {
  const t = r.text?.trim();
  if (t) return t;
  return r.snippet?.trim() ?? '';
}
