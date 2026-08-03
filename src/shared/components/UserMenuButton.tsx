import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, Pressable, StyleSheet, useColorScheme, Platform,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '../theme';
import { ICONS, ICON_SIZES } from '../theme';
import AppIcon from './AppIcon';
import { useAccountMenu } from '../hooks/useAccountMenu';

export default function UserMenuButton() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [open, setOpen] = useState(false);
  const pendingAction = useRef<(() => void) | null>(null);
  const { openKonto, openSettings, openArbeitstexte, openAbout } = useAccountMenu();

  const flushPending = () => {
    const action = pendingAction.current;
    pendingAction.current = null;
    action?.();
  };

  const closeThen = (action: () => void) => {
    pendingAction.current = action;
    setOpen(false);
    // onDismiss ist iOS-only — sonst bleibt die Navigation hängen.
    if (Platform.OS !== 'ios') {
      setTimeout(flushPending, 0);
    }
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

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        onDismiss={flushPending}
      >
        {/* Backdrop zuerst rendern (liegt im Z-Order unter dem Menü). Kein GestureHandlerRootView —
            der hinterlässt auf iOS nach Modal-Dismiss einen Ghost-Touch-Layer der Scroll blockiert. */}
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setOpen(false)} accessibilityRole="button" accessibilityLabel="Menü schließen" />
        <View
          style={[styles.menu, { backgroundColor: colors.surfaceContainerHigh, shadowColor: colors.shadow }]}
        >
          <TouchableOpacity style={styles.menuRow} onPress={() => closeThen(openArbeitstexte)} activeOpacity={0.7}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>Arbeitstexte</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <TouchableOpacity style={styles.menuRow} onPress={() => closeThen(openKonto)} activeOpacity={0.7}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>Konto</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuRow} onPress={() => closeThen(openSettings)} activeOpacity={0.7}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>Einstellungen</Text>
          </TouchableOpacity>
          <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
          <TouchableOpacity style={styles.menuRow} onPress={() => closeThen(openAbout)} activeOpacity={0.7}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>Über Philo</Text>
          </TouchableOpacity>
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
  menu: {
    position: 'absolute',
    top: 56,
    right: spacing.m,
    zIndex: 2,
    elevation: 8,
    minWidth: 180,
    borderRadius: 8,
    paddingVertical: spacing.xs,
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
