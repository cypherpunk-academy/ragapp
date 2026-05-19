import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { getEntityCardStyle } from '@/shared/theme/entityCards';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';

const PERSONALITY_LABELS: Record<string, string> = {
  sokrates: 'Sokrates',
  socrates: 'Sokrates',
  'der-machtarchitekt': 'Der Machtarchitekt',
  'assistant-host': 'Assistant Host',
  'assistant-host-deep': 'Assistant Host Deep',
};

function personalityLabel(slug: string | null | undefined): string {
  if (!slug) return 'KI';
  return PERSONALITY_LABELS[slug] ?? slug;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

type Props = {
  talk: Talk;
  snippetTurn: Turn | null;
  onPress: () => void;
};

export default function TalkCard({ talk, snippetTurn, onPress }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const cardStyle = getEntityCardStyle(colors, 'talk', isDark);

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
      {/* Typ-Label + Datum */}
      <View style={styles.metaRow}>
        <Text style={[textStyles.noteMeta, { color: cardStyle.accentColor, letterSpacing: 0.8 }]}>
          {cardStyle.label.toUpperCase()}
        </Text>
        <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
          {'·'}
        </Text>
        <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
          {formatDate(talk.updatedAt)} · {personalityLabel(snippetTurn?.assistantPersonality)}
        </Text>
      </View>

      {/* Titel */}
      {talk.title ? (
        <Text style={[textStyles.chapterTitle, { color: colors.onBackground, textAlign: 'left' }]}>
          {talk.title.toUpperCase()}
        </Text>
      ) : null}

      {/* Erste Frage als Snippet */}
      {snippetTurn ? (
        <Text style={[textStyles.conversationSnippet, { color: colors.onSurface }]} numberOfLines={3}>
          {snippetTurn.userMessage}
        </Text>
      ) : null}

      {/* Zusammenfassung */}
      {talk.summary ? (
        <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
          {talk.summary}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.m, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' },
});
