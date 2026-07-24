import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, useColorScheme,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles, typography } from '../theme';
import { ICONS, ICON_SIZES } from '../theme';
import AppIcon from './AppIcon';
import UserMenuButton from './UserMenuButton';
import { useWarnings } from '../contexts/WarningsContext';

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
  const { warnings } = useWarnings();
  const [overlayOpen, setOverlayOpen] = useState(false);
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.bar,
      { backgroundColor: colors.surface, borderBottomColor: colors.outlineVariant, paddingTop: insets.top },
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
      {warnings.length > 0 ? (
        <TouchableOpacity
          onPress={() => setOverlayOpen(true)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Warnungen anzeigen"
        >
          <AppIcon name="warning" size={ICON_SIZES.appBar} color={colors.error} />
        </TouchableOpacity>
      ) : null}
      {offline ? (
        <AppIcon name={ICONS.status.offline} size={ICON_SIZES.appBar} color={colors.onSurfaceVariant} />
      ) : null}
      {trailing}
      {showUserMenu ? <UserMenuButton /> : null}

      <Modal visible={overlayOpen} transparent animationType="fade" onRequestClose={() => setOverlayOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOverlayOpen(false)} accessibilityRole="button" accessibilityLabel="Hinweise schließen" />
        <View style={[styles.warningsPanel, { backgroundColor: colors.errorContainer, shadowColor: colors.shadow }]}>
          <View style={styles.warningsPanelHeader}>
            <AppIcon name="warning" size={18} color={colors.error} />
            <Text style={[textStyles.labelSection, { color: colors.onErrorContainer }]}>Hinweise</Text>
          </View>
          <View style={[styles.warningsDivider, { backgroundColor: colors.error }]} />
          {warnings.map(({ id, message }) => (
            <Text key={id} style={[typography.bodySmall, styles.warningItem, { color: colors.onErrorContainer }]}>
              {message}
            </Text>
          ))}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 64,
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    gap: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: {
    marginRight: -spacing.xs,
  },
  title: {
    flex: 1,
  },
  warningsPanel: {
    position: 'absolute',
    top: 56,
    right: spacing.m,
    left: spacing.m,
    zIndex: 2,
    borderRadius: 10,
    paddingVertical: spacing.s,
    elevation: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  warningsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs,
  },
  warningsDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.m,
    marginBottom: spacing.xs,
    opacity: 0.5,
  },
  warningItem: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
});
