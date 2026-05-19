import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme';
import { contributionIcon, ICON_SIZES, type ContributionKind } from '../theme';
import AppIcon from './AppIcon';

const KINDS: ContributionKind[] = ['notes', 'conversations', 'rag'];

export type ContributionCounts = {
  notes: number;
  conversations: number;
  rag: number;
};

type Props = {
  counts: ContributionCounts;
  /** Wenn false, Einträge mit 0 ausblenden (Default). */
  hideZero?: boolean;
};

export default function ContributionStrip({ counts, hideZero = true }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const iconColor = colors.onSurfaceVariant;

  return (
    <View style={styles.row}>
      {KINDS.map((kind) => {
        const n = counts[kind];
        if (hideZero && n <= 0) return null;
        return (
          <View key={kind} style={styles.item}>
            <AppIcon name={contributionIcon(kind)} size={ICON_SIZES.strip} color={iconColor} />
            <Text style={[styles.count, { color: iconColor }]}>{n}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: {
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
  },
});
