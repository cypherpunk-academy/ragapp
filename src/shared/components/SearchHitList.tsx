import React, { useCallback, useEffect, useRef } from 'react';
import { FlatList, View, StyleSheet, type ListRenderItem } from 'react-native';
import { spacing } from '@/shared/theme';
import SearchHitRow from '@/shared/components/SearchHitRow';
import { useSearchHitNavigation } from '@/shared/hooks/useSearchHitNavigation';
import type { RagHit } from '@/shared/lib/ragHits';

type Props = {
  results: RagHit[];
  ListHeaderComponent?: React.ComponentType | React.ReactElement | null;
  contentContainerStyle?: object;
  /** FlatList-Position (0-basiert), zu der nach Öffnen gescrollt wird. */
  scrollToIndex?: number;
  /** Zeile visuell hervorheben (z. B. nach Tap auf `[N]`). */
  highlightIndex?: number;
};

/**
 * Vertikale Liste von Suchtreffer-Karten — geteilt zwischen KI-Suche und Chat-RAG-Insights.
 */
export default function SearchHitList({
  results, ListHeaderComponent, contentContainerStyle, scrollToIndex, highlightIndex,
}: Props) {
  const listRef = useRef<FlatList<RagHit>>(null);
  // Nur von RagInsightsOverlay (Chat-Quellenverweise) verwendet — „Zurück" muss dorthin zurückführen, nicht zur KI-Suche.
  const handleNavigate = useSearchHitNavigation('chat');

  useEffect(() => {
    if (scrollToIndex == null || scrollToIndex < 0 || scrollToIndex >= results.length) return;
    const t = setTimeout(() => {
      listRef.current?.scrollToIndex({ index: scrollToIndex, animated: true, viewPosition: 0.2 });
    }, 120);
    return () => clearTimeout(t);
  }, [scrollToIndex, results.length]);

  const renderItem: ListRenderItem<RagHit> = useCallback(
    ({ item, index }) => (
      <SearchHitRow
        result={item}
        onNavigate={handleNavigate}
        highlighted={highlightIndex === index}
      />
    ),
    [handleNavigate, highlightIndex],
  );

  const keyExtractor = useCallback(
    (item: RagHit, index: number) => item.chunk_id || `hit-${index}`,
    [],
  );

  return (
    <FlatList
      ref={listRef}
      data={results}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      ListHeaderComponent={ListHeaderComponent}
      contentContainerStyle={[styles.listContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      onScrollToIndexFailed={(info) => {
        setTimeout(() => {
          listRef.current?.scrollToOffset({
            offset: Math.max(0, info.averageItemLength * info.index),
            animated: true,
          });
        }, 80);
      }}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { paddingHorizontal: spacing.m, paddingBottom: spacing.xl },
  separator: { height: spacing.m },
});
