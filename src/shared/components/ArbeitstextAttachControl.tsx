import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { getNoteBadgeStyle, ICONS, ICON_SIZES, spacing, textStyles, lightColors, darkColors } from '@/shared/theme';
import AppIcon from '@/shared/components/AppIcon';
import type Note from '@/data/db/models/Note';

type Props = {
  note: Note | null;
  onPress: () => void;
};

/** Büroklammer; bei verknüpftem Arbeitstext mit grünem „Arbeitstext“-Label. */
export default function ArbeitstextAttachControl({ note, onPress }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const badge = getNoteBadgeStyle(isDark);

  return (
    <TouchableOpacity
      onPress={onPress}
      hitSlop={8}
      activeOpacity={0.8}
      style={styles.row}
      accessibilityRole="button"
      accessibilityLabel={note ? 'Arbeitstext öffnen' : 'Arbeitstext verknüpfen'}
    >
      <AppIcon
        name={ICONS.arbeitstext.attach}
        size={ICON_SIZES.menu}
        color={note ? badge.textColor : colors.onSurfaceVariant}
      />
      {note ? (
        <View style={[styles.badge, { backgroundColor: badge.backgroundColor }]}>
          <Text style={[textStyles.noteMeta, { color: badge.textColor }]} numberOfLines={1}>
            Arbeitstext
          </Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 1,
    maxWidth: '70%',
  },
  badge: {
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 1,
  },
});
