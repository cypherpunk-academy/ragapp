import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import type Turn from '@/data/db/models/Turn';

type Props = {
  turn: Turn;
  kind: 'user' | 'assistant';
  personalityLabel?: string;
  /** Anzahl eindeutiger `[N]`-Marker; Fallback: Gesamttreffer. */
  ragHitCount?: number;
  onRagHitsPress?: () => void;
};

function formatTurnTime(createdAt: Date): string {
  return createdAt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Meta-Zeile unter Chat-Bubbles (Figma §16.6): Zeit · Sender · optional KI-Suche-Link.
 */
export default function TurnMetaLine({
  turn, kind, personalityLabel, ragHitCount = 0, onRagHitsPress,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const time = formatTurnTime(turn.createdAt);
  const showRagLink = kind === 'assistant' && ragHitCount > 0 && onRagHitsPress;

  return (
    <View style={[styles.row, kind === 'user' ? styles.rowUser : styles.rowAssistant]}>
      <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
        {time}
        {' · '}
        {kind === 'user' ? 'ICH' : (personalityLabel ?? 'KI').toUpperCase()}
      </Text>
      {showRagLink ? (
        <>
          <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}> · </Text>
          <TouchableOpacity onPress={onRagHitsPress} hitSlop={6} activeOpacity={0.7}>
            <Text style={[textStyles.noteMeta, { color: colors.primary }]}>
              KI-Suche ({ragHitCount})
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    paddingHorizontal: spacing.xs,
  },
  rowUser: { alignSelf: 'flex-end' },
  rowAssistant: { alignSelf: 'flex-start' },
});
