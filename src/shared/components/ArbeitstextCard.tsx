import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, textStyles, ICONS, ICON_SIZES } from '@/shared/theme';
import { getEntityCardStyle } from '@/shared/theme/entityCards';
import AppIcon from '@/shared/components/AppIcon';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import { formatDocumentCharCount } from '@/data/lib/documentLimits';
import { ARBEITSTEXT_CONTEXT_TIER_LABELS, type ArbeitstextContextTier } from '@/shared/lib/arbeitstextContext';
import { formatRelativeTime } from '@/shared/lib/relativeTime';
import type Note from '@/data/db/models/Note';

const TIER_ICON = {
  paragraph: ICONS.context.paragraph,
  segment: ICONS.context.lecture,
  source: ICONS.context.work,
  general: ICONS.context.general,
} as const;

type Props = {
  note: Note;
  tier: ArbeitstextContextTier;
  onPress: () => void;
};

export default function ArbeitstextCard({ note, tier, onPress }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const cardStyle = getEntityCardStyle(colors, 'notiz', isDark);
  const title = extractDocumentTitle(note.content);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardStyle.backgroundColor,
          borderColor: cardStyle.borderColor,
          borderWidth: cardStyle.borderWidth,
          borderRadius: cardStyle.borderRadius,
        },
      ]}
    >
      <View style={styles.metaRow}>
        <AppIcon name={TIER_ICON[tier]} size={ICON_SIZES.menu} color={cardStyle.accentColor} />
        <Text style={[textStyles.noteMeta, { color: cardStyle.accentColor, letterSpacing: 0.8 }]}>
          {ARBEITSTEXT_CONTEXT_TIER_LABELS[tier].toUpperCase()}
        </Text>
        <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>·</Text>
        <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
          {formatRelativeTime(note.updatedAt)}
        </Text>
      </View>

      <Text style={[textStyles.chapterTitle, { color: colors.onBackground, textAlign: 'left' }]} numberOfLines={1}>
        {title}
      </Text>

      <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
        {formatDocumentCharCount(note.content)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.m, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
});
