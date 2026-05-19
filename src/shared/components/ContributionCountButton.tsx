import React from 'react';
import { TouchableOpacity, Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme';
import { contributionIcon, ICON_SIZES, type ContributionKind } from '../theme';
import AppIcon from './AppIcon';

export type { ContributionKind };

type Props = {
  kind: ContributionKind;
  count: number;
  onPress?: () => void;
};

export default function ContributionCountButton({ kind, count, onPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const iconColor = colors.onSurfaceVariant;

  if (count <= 0) return null;

  return (
    <TouchableOpacity
      style={styles.btn}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.6}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
    >
      <AppIcon name={contributionIcon(kind)} size={ICON_SIZES.strip} color={iconColor} />
      <Text style={[styles.count, { color: iconColor }]}>{count}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
