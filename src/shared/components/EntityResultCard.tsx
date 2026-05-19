import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { getEntityCardStyle, type EntityKind } from '@/shared/theme/entityCards';

type Props = {
  kind: EntityKind;
  title: string;
  subtitle?: string;
  snippet?: string;
  badge?: string;
  onPress?: () => void;
};

export default function EntityResultCard({ kind, title, subtitle, snippet, badge, onPress }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const cardStyle = getEntityCardStyle(colors, kind, isDark);

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
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
      {/* Typ-Label (erste Zeile, farbig) */}
      <View style={styles.metaRow}>
        <Text style={[textStyles.noteMeta, { color: cardStyle.accentColor, letterSpacing: 0.8 }]}>
          {cardStyle.label.toUpperCase()}
        </Text>
        {badge ? (
          <>
            <Text style={[textStyles.noteMeta, { color: cardStyle.accentColor }]}>·</Text>
            <Text style={[textStyles.noteMeta, { color: cardStyle.accentColor }]}>{badge}</Text>
          </>
        ) : null}
      </View>

      {/* Titel */}
      <Text style={[textStyles.chapterTitle, { color: colors.onBackground, textAlign: 'left' }]} numberOfLines={2}>
        {title}
      </Text>

      {/* Untertitel / Kapitel */}
      {subtitle ? (
        <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
          {subtitle}
        </Text>
      ) : null}

      {/* Snippet */}
      {snippet ? (
        <Text style={[textStyles.noteBody, { color: colors.onSurface }]} numberOfLines={3}>
          {snippet}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.m, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
