import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import AppBar from '@/shared/components/AppBar';
import { router } from 'expo-router';
import { lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { useSettings, type ColorSchemePreference, type FontSizeLevel } from '@/shared/contexts/SettingsContext';

const COLOR_SCHEME_OPTIONS: { value: ColorSchemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Hell' },
  { value: 'dark', label: 'Dunkel' },
];

const FONT_SIZE_OPTIONS: { value: FontSizeLevel; label: string }[] = [
  { value: 'small', label: 'A−' },
  { value: 'medium', label: 'A' },
  { value: 'large', label: 'A+' },
  { value: 'xlarge', label: 'A++' },
  { value: 'xxlarge', label: 'A+++' },
];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { colorScheme: schemePref, fontSizeLevel, setColorScheme, setFontSizeLevel } = useSettings();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title="Einstellungen" onBackPress={() => router.back()} showUserMenu={false} />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            DARSTELLUNG
          </Text>

          {/* Dunkelmodus */}
          <Text style={[typography.labelMedium, styles.rowLabel, { color: colors.onSurface }]}>
            Dunkelmodus
          </Text>
          <View style={[styles.segmented, { backgroundColor: colors.surfaceContainerHigh, borderRadius: 10 }]}>
            {COLOR_SCHEME_OPTIONS.map((opt) => {
              const active = opt.value === schemePref;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setColorScheme(opt.value)}
                  style={[
                    styles.segmentBtn,
                    active && { backgroundColor: colors.primary, borderRadius: 8 },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    typography.labelMedium,
                    { color: active ? colors.onPrimary : colors.onSurfaceVariant },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Schriftgröße */}
          <Text style={[typography.labelMedium, styles.rowLabel, { color: colors.onSurface }]}>
            Schriftgröße
          </Text>
          <View style={[styles.segmented, { backgroundColor: colors.surfaceContainerHigh, borderRadius: 10 }]}>
            {FONT_SIZE_OPTIONS.map((opt) => {
              const active = opt.value === fontSizeLevel;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => setFontSizeLevel(opt.value)}
                  style={[
                    styles.segmentBtn,
                    active && { backgroundColor: colors.primary, borderRadius: 8 },
                  ]}
                  activeOpacity={0.75}
                >
                  <Text style={[
                    typography.labelMedium,
                    { color: active ? colors.onPrimary : colors.onSurfaceVariant },
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.card, { backgroundColor: colors.surfaceContainer }]}
          onPress={() => router.push('/about')}
          activeOpacity={0.7}
        >
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            ÜBER
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.primary }]}>Über Philo von Freisinn →</Text>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.m, gap: spacing.m },
  card: { borderRadius: 12, padding: spacing.l, gap: spacing.s },
  rowLabel: { marginTop: spacing.xs },
  segmented: {
    flexDirection: 'row',
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.s,
  },
});
