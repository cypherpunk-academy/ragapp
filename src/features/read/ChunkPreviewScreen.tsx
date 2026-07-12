import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { parseMdInline } from '@/shared/lib/parseMdInline';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import { useChunkPreviewBody } from '@/shared/hooks/useChunkPreviewBody';
import type { SummaryReadTarget } from '@/shared/lib/searchHitCard';
import SegmentTitleText from '@/shared/components/SegmentTitleText';

type Props = {
  visible: boolean;
  onClose: () => void;
  onNavigateToRead?: (target: SummaryReadTarget) => void;
  chunkId: string;
  sourceId: string;
  title?: string | null;
  /** Aus Suche; bei leerem Text optional Nachladen via `getChunk`. */
  initialText: string;
  readTarget?: SummaryReadTarget;
};

export default function ChunkPreviewScreen({
  visible, onClose, onNavigateToRead, chunkId, sourceId, title, initialText, readTarget,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const body = useChunkPreviewBody(chunkId, sourceId, initialText);
  if (!visible) return null;

  const displayTitle = title?.trim() || 'Text';

  return (
    <View
      style={[
        overlayStyles.fullscreen,
        styles.root,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      <View style={[styles.appBar, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.titleBtn}
          disabled={!readTarget || !onNavigateToRead}
          activeOpacity={readTarget ? 0.7 : 1}
          onPress={() => readTarget && onNavigateToRead?.(readTarget)}
        >
          <SegmentTitleText
            title={displayTitle}
            style={[textStyles.contributionsTitle, { color: colors.onBackground, flex: 1 }]}
            numberOfLines={2}
          />
        </TouchableOpacity>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.l }]}
      >
        <Pressable
          disabled={!readTarget || !onNavigateToRead}
          onPress={() => readTarget && onNavigateToRead?.(readTarget)}
          style={({ pressed }) => [pressed && readTarget ? styles.contentPressed : null]}
        >
          <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
            {parseMdInline(body).map((seg, i) =>
              seg.bold ? (
                <Text key={i} style={{ fontWeight: '700' }}>{seg.text}</Text>
              ) : seg.italic ? (
                <Text key={i} style={[textStyles.readingItalic, { color: '#B25738' }]}>{seg.text}</Text>
              ) : (
                <Text key={i}>{seg.text}</Text>
              )
            )}
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { zIndex: 110 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  backBtn: { padding: spacing.xs },
  titleBtn: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: spacing.m },
  contentPressed: { opacity: 0.85 },
});
