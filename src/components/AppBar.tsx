import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useColorScheme,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, textStyles } from '../theme';

type Props = {
  title: string;
  offline?: boolean;
  onAccountPress?: () => void;
  onBackPress?: () => void;
};

export default function AppBar({ title, offline = false, onAccountPress, onBackPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[
      styles.bar,
      { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant },
    ]}>
      {onBackPress ? (
        <TouchableOpacity
          onPress={onBackPress}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Zurück"
        >
          <MaterialIcons name="chevron-left" size={28} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
      <Text
        style={[textStyles.titlePage, styles.title, { color: colors.onSurface }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {offline ? (
        <MaterialIcons name="cloud-off" size={24} color={colors.onSurfaceVariant} />
      ) : null}
      <TouchableOpacity
        onPress={onAccountPress}
        style={[styles.avatar, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Konto"
      >
        <MaterialIcons name="person" size={20} color={colors.onPrimary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 64,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    marginRight: -spacing.xs,
  },
  title: {
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
