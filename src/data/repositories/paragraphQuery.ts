import { Q } from '@nozbe/watermelondb';

/** Canonical rag_paragraphs id: `{source_id}:{segment_index}:{paragraph_number}`. */
export function paragraphIdPrefix(sourceId: string): string {
  return `${sourceId}:`;
}

/** Excludes legacy slug ids and deprecated rows from sync leftovers. */
export function paragraphClausesForSource(sourceId: string) {
  return [
    Q.where('source_id', sourceId),
    Q.where('id', Q.like(`${paragraphIdPrefix(sourceId)}%`)),
    Q.where('deprecated_at', null),
  ];
}
