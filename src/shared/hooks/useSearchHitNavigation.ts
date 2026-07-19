import { useCallback } from 'react';
import { useReading } from '@/shared/contexts/ReadingContext';
import type { SearchHitNavigation } from '@/shared/lib/searchHitCard';

/**
 * Navigation aus Suchtreffer-Karten (Lesen-Tab oder Chunk-Overlay).
 * `origin` bestimmt, wohin der „Zurück"-Button vom Lesen-Tab führt: zur KI-Suche
 * (Suche-Tab) oder zurück zu den Quellenverweisen (Chat-Overlay).
 */
export function useSearchHitNavigation(origin: 'search' | 'chat' = 'search') {
  const { navigateToRead, openChunkPreview } = useReading();

  return useCallback(
    (nav: SearchHitNavigation) => {
      if (nav.kind === 'read') {
        navigateToRead({
          sourceId: nav.sourceId,
          segmentIndex: nav.segmentIndex ?? null,
          paragraphId: nav.paragraphId,
          markerOffset: nav.markerOffset ?? null,
          fromSearch: origin,
        });
      } else if (nav.kind === 'overlay') {
        openChunkPreview({
          sourceId: nav.sourceId,
          chunkId: nav.chunkId,
          title: nav.title,
          initialText: nav.initialText,
          readTarget: nav.readTarget,
          origin,
        });
      }
    },
    [navigateToRead, openChunkPreview, origin],
  );
}
