import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppBar from '@/shared/components/AppBar';
import SearchHitList from '@/shared/components/SearchHitList';
import { overlayStyles } from '@/shared/styles/overlays';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { formatTurnUsageLine, parseTurnUsage } from '@/shared/lib/ragHits';
import type { RagHit } from '@/shared/lib/ragHits';
import type Turn from '@/data/db/models/Turn';

type Props = {
  visible: boolean;
  turn: Turn | null;
  hits: RagHit[];
  onClose: () => void;
  /** FlatList-Position (0-basiert) — z. B. nach Tap auf `[3]` im Antworttext. */
  scrollToIndex?: number;
};

/**
 * Vollbild-Overlay: alle RAG/Qdrant-Treffer einer Assistenten-Antwort.
 * Treffer-Karten identisch zur KI-Suche (`SearchHitList` / `EntityResultCard`).
 */
export default function RagInsightsOverlay({
  visible, turn, hits, onClose, scrollToIndex,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const usageLine = useMemo(
    () => formatTurnUsageLine(parseTurnUsage(turn?.usage ?? null)),
    [turn?.usage],
  );

  if (!visible || !turn) return null;

  const header = (
    <View style={styles.headerBlock}>
      {usageLine ? (
        <Text style={[textStyles.noteMeta, styles.usageLine, { color: colors.onSurfaceVariant }]}>
          {usageLine}
        </Text>
      ) : null}
      <Text style={[textStyles.labelSection, { color: colors.onSurface, marginTop: spacing.s }]}>
        {hits.length} {hits.length === 1 ? 'Treffer' : 'Treffer'}
      </Text>
    </View>
  );

  return (
    <View
      style={[
        overlayStyles.fullscreen,
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <AppBar title="KI-Treffer" onBackPress={onClose} showUserMenu={false} />
      {hits.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyWrap}>
          {header}
          <Text style={[textStyles.noteBody, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            Keine Treffer für diese Antwort gespeichert.
          </Text>
        </ScrollView>
      ) : (
        <SearchHitList
          results={hits}
          ListHeaderComponent={header}
          scrollToIndex={scrollToIndex}
          highlightIndex={scrollToIndex}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerBlock: { paddingTop: spacing.m, paddingBottom: spacing.s },
  usageLine: {
    marginTop: spacing.s,
    letterSpacing: 0.3,
  },
  emptyWrap: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xl,
    flexGrow: 1,
  },
});
