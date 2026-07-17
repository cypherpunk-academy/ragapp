import { useCallback } from 'react';
import { useReading } from '@/shared/contexts/ReadingContext';
import type { SearchHitNavigation } from '@/shared/lib/searchHitCard';

/** Navigation aus Suchtreffer-Karten (Lesen-Tab oder Chunk-Overlay). */
export function useSearchHitNavigation() {
  const { navigateToRead, openChunkPreview } = useReading();

  return useCallback(
    (nav: SearchHitNavigation) => {
      if (nav.kind === 'read') {
        navigateToRead({
          sourceId: nav.sourceId,
          segmentIndex: nav.segmentIndex ?? null,
          paragraphId: nav.paragraphId,
          markerOffset: nav.markerOffset ?? null,
          fromSearch: true,
        });
      } else if (nav.kind === 'overlay') {
        openChunkPreview({
          sourceId: nav.sourceId,
          chunkId: nav.chunkId,
          title: nav.title,
          initialText: nav.initialText,
          readTarget: nav.readTarget,
        });
      }
    },
    [navigateToRead, openChunkPreview],
  );
}
