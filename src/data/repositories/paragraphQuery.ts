import { Q } from '@nozbe/watermelondb';

/** Active paragraphs for a source (id is UUIDv4). */
export function paragraphClausesForSource(sourceId: string) {
  return [
    Q.where('source_id', sourceId),
    Q.where('deprecated_at', null),
  ];
}
