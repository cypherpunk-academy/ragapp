import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, useColorScheme,
  type TextStyle,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '../theme';
import { ICONS, ICON_SIZES } from '../theme';
import AppIcon from './AppIcon';
import UserMenuButton from './UserMenuButton';

type Props = {
  title: string;
  titleStyle?: TextStyle;
  offline?: boolean;
  onBackPress?: () => void;
  /** User-Icon mit Konto/Einstellungen-Menü (Standard: true). */
  showUserMenu?: boolean;
  /** Zusätzliche Aktionen rechts neben dem User-Menü. */
  trailing?: React.ReactNode;
};

export default function AppBar({
  title,
  titleStyle,
  offline = false,
  onBackPress,
  showUserMenu = true,
  trailing,
}: Props) {
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
          <AppIcon name={ICONS.nav.back} size={28} color={colors.primary} />
        </TouchableOpacity>
      ) : null}
      <Text
        style={[textStyles.titlePage, titleStyle, styles.title, { color: colors.onSurface }]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {offline ? (
        <AppIcon name={ICONS.status.offline} size={ICON_SIZES.appBar} color={colors.onSurfaceVariant} />
      ) : null}
      {trailing}
      {showUserMenu ? <UserMenuButton /> : null}
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
});
