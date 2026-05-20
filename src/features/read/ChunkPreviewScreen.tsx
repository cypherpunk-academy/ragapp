import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import { useChunkPreviewBody } from '@/shared/hooks/useChunkPreviewBody';

type Props = {
  visible: boolean;
  onClose: () => void;
  chunkId: string;
  sourceId: string;
  title?: string | null;
  /** Aus Suche; bei leerem Text optional Nachladen via `getChunk`. */
  initialText: string;
};

export default function ChunkPreviewScreen({
  visible, onClose, chunkId, sourceId, title, initialText,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const body = useChunkPreviewBody(chunkId, sourceId, initialText);
  if (!visible) return null;

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
        <Text
          style={[textStyles.contributionsTitle, { color: colors.onBackground, flex: 1 }]}
          numberOfLines={2}
        >
          {title?.trim() || 'Text'}
        </Text>
      </View>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.l }]}
      >
        <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>{body}</Text>
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
  scroll: { flex: 1 },
  content: { padding: spacing.m },
});
