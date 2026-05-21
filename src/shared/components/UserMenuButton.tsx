import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, useColorScheme,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '../theme';
import { ICONS, ICON_SIZES } from '../theme';
import AppIcon from './AppIcon';
import { useAccountMenu } from '../hooks/useAccountMenu';

export default function UserMenuButton() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [open, setOpen] = useState(false);
  const { openKonto, openSettings } = useAccountMenu();

  const handleKonto = () => {
    setOpen(false);
    openKonto();
  };

  const handleSettings = () => {
    setOpen(false);
    openSettings();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[styles.avatar, { backgroundColor: colors.primary }]}
        accessibilityRole="button"
        accessibilityLabel="Benutzermenü"
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <AppIcon name={ICONS.account.avatar} size={ICON_SIZES.tabHeader} color={colors.onPrimary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} />
          <View style={[styles.menu, { backgroundColor: colors.surfaceContainerHigh, shadowColor: colors.shadow }]}>
            <TouchableOpacity style={styles.menuRow} onPress={handleKonto} activeOpacity={0.7}>
              <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>Konto</Text>
            </TouchableOpacity>
            <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
            <TouchableOpacity style={styles.menuRow} onPress={handleSettings} activeOpacity={0.7}>
              <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>Einstellungen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 56,
    right: spacing.m,
    minWidth: 180,
    borderRadius: 8,
    paddingVertical: spacing.xs,
    elevation: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  menuRow: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    minHeight: 44,
    justifyContent: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.m,
  },
});
