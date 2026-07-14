/**
 * Arbeitstext-Größenlimits (Filo §5.3, Contract §2.3).
 */

/** Hard-Limit für `notes.content.length` — Client + Tool-Validierung (ragrun). */
export const MAX_DOCUMENT_CHARS = 50_000;

/** Konservative Kontext-Budget-Untergrenze (Tokens), ~4 Zeichen/Token, Deutsch oft etwas mehr. */
export const DOCUMENT_CONTEXT_TOKEN_BUDGET_MIN = 10_000;

/** Obere Kontext-Budget-Schätzung (Tokens). */
export const DOCUMENT_CONTEXT_TOKEN_BUDGET_MAX = 12_000;

export function isWithinDocumentLimit(content: string): boolean {
  return content.length <= MAX_DOCUMENT_CHARS;
}

export function remainingDocumentChars(content: string): number {
  return Math.max(0, MAX_DOCUMENT_CHARS - content.length);
}

/** z. B. "1 234 / 50 000" für die Bibliothek-Listenzeile. */
export function formatDocumentCharCount(content: string): string {
  return `${content.length.toLocaleString('de-DE')} / ${MAX_DOCUMENT_CHARS.toLocaleString('de-DE')}`;
}
