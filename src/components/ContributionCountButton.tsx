import React from 'react';
import { TouchableOpacity, Text, StyleSheet, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors } from '../theme';

export type ContributionKind = 'notes' | 'conversations' | 'rag';

const ICONS: Record<ContributionKind, keyof typeof Ionicons.glyphMap> = {
  notes: 'create-outline',
  conversations: 'chatbubble-outline',
  rag: 'locate-outline',
};

type Props = {
  kind: ContributionKind;
  count: number;
  onPress?: () => void;
};

export default function ContributionCountButton({ kind, count, onPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  if (count <= 0) return null;

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <Ionicons name={ICONS[kind]} size={12} color={colors.onSurfaceVariant} />
      <Text style={[styles.count, { color: colors.onSurfaceVariant }]}>{count}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 2,
    paddingVertical: 0,
  },
  count: {
    fontSize: 11,
    lineHeight: 14,
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
  },
});
