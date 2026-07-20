import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import EntityResultCard from '@/shared/components/EntityResultCard';
import { entityKindFromSearchResult } from '@/shared/theme/entityCards';
import { buildSearchHitCard } from '@/shared/lib/searchHitCard';
import { spacing } from '@/shared/theme';
import type { RagHit } from '@/shared/lib/ragHits';
import type { SearchHitNavigation } from '@/shared/lib/searchHitCard';

type Props = {
  result: RagHit;
  onNavigate: (nav: SearchHitNavigation) => void;
  highlighted?: boolean;
};

/**
 * Eine Suchtreffer-Karte — gleiches Layout wie in der KI-Suche.
 * Wird von SearchScreen und RagInsightsOverlay geteilt.
 */
export default function SearchHitRow({ result, onNavigate, highlighted }: Props) {
  const kind = entityKindFromSearchResult(result);
  const { card, navigation } = buildSearchHitCard(result, kind);

  const handlePress = useCallback(() => {
    if (navigation.kind !== 'none') onNavigate(navigation);
  }, [navigation, onNavigate]);

  return (
    <View style={highlighted ? styles.highlighted : undefined}>
      <EntityResultCard
        kind={kind}
        metaSmall={card.metaSmall}
        headlineLarge={card.headlineLarge}
        subHeadSmall={card.subHeadSmall}
        badgeSuffix={card.badgeSuffix}
        notizRows={card.notizRows}
        bodyMode={card.bodyMode}
        bodyMarkdown={card.bodyMarkdown}
        bodyText={card.bodyText}
        relevancePercent={
          typeof result.score === 'number' && result.score > 0
            ? Math.round(Math.min(1, result.score) * 100)
            : undefined
        }
        citationIndex={result.citationIndex}
        onPress={navigation.kind !== 'none' ? handlePress : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  highlighted: {
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(75, 92, 146, 0.55)',
    padding: spacing.xs,
  },
});
