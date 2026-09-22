import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import AppBar from '@/shared/components/AppBar';
import { router } from 'expo-router';
import { lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { useSettings, type ColorSchemePreference, type FontSizeLevel } from '@/shared/contexts/SettingsContext';

export default function SettingsScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { colorScheme: schemePref, fontSizeLevel, setColorScheme, setFontSizeLevel } = useSettings();

  const colorSchemeOptions = useMemo(
    (): { value: ColorSchemePreference; label: string }[] => [
      { value: 'system', label: t('settings.schemeSystem') },
      { value: 'light', label: t('settings.schemeLight') },
      { value: 'dark', label: t('settings.schemeDark') },
    ],
    [t],
  );

  const fontSizeOptions = useMemo(
    (): { value: FontSizeLevel; label: string }[] => [
      { value: 'small', label: t('settings.fontSmall') },
      { value: 'medium', label: t('settings.fontMedium') },
      { value: 'large', label: t('settings.fontLarge') },
      { value: 'xlarge', label: t('settings.fontXLarge') },
      { value: 'xxlarge', label: t('settings.fontXXLarge') },
    ],
    [t],
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title={t('settings.title')} onBackPress={() => router.back()} showUserMenu={false} />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            {t('settings.appearanceSection')}
          </Text>

          {/* Dunkelmodus */}
          <Text style={[typography.labelMedium, styles.rowLabel, { color: colors.onSurface }]}>
            {t('settings.darkMode')}
          </Text>
          <View style={[styles.segmented, { backgroundColor: colors.surfaceContainerHigh, borderRadius: 10 }]}>
            {colorSchemeOptions.map((opt) => {
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
            {t('settings.fontSize')}
          </Text>
          <View style={[styles.segmented, { backgroundColor: colors.surfaceContainerHigh, borderRadius: 10 }]}>
            {fontSizeOptions.map((opt) => {
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

        {(__DEV__ || process.env.EXPO_PUBLIC_SUPABASE_URL?.includes('duhtxxbynkilpxdpcpsk')) && (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.surfaceContainer }]}
            onPress={() => router.push('/deep-link-test')}
            activeOpacity={0.7}
          >
            <Text style={[typography.labelMedium, { color: colors.onSurface }]}>
              Deep-Link-Test
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
              Claude-Absprung testen (nur Dev-Build)
            </Text>
          </TouchableOpacity>
        )}

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
