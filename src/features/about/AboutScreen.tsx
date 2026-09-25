import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View, Text, ScrollView, StyleSheet, useColorScheme, Linking, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import * as Application from 'expo-application';
import { router } from 'expo-router';
import AppBar from '@/shared/components/AppBar';
import { lightColors, darkColors, spacing, textStyles, typography, fonts } from '@/shared/theme';
import i18n from '@/shared/i18n';
import { SourceRepository, type Source } from '@/data/repositories/SourceRepository';

/** Marketing version from app.config.js (e.g. 1.0.0). */
const appVersion = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Native build number (Android versionCode / iOS CFBundleVersion).
 * Use expo-application — Constants.nativeBuildVersion was removed.
 * Falls back to extra.buildNumber (optional override from app.config.js).
 */
const buildNumber =
  Application.nativeBuildVersion
  || (Constants.expoConfig?.extra as { buildNumber?: string } | undefined)?.buildNumber
  || null;

/** Short git SHA from app.config.js extra (EAS or local HEAD). */
const gitCommitShort =
  (Constants.expoConfig?.extra as { gitCommitShort?: string } | undefined)?.gitCommitShort
  || null;

/** e.g. "1.0.0 beta-15-77a05a62" */
function formatAppVersionLabel(): string {
  let label = i18n.t('common.versionBeta', { version: appVersion });
  if (buildNumber) label += `-${buildNumber}`;
  if (gitCommitShort) label += `-${gitCommitShort}`;
  return label;
}

/** Shared body face — avoids Roboto (Android) vs SF Pro (iOS) metric drift. */
const bookLine = {
  fontFamily: fonts.derived,
  fontSize: typography.bodyMedium.fontSize,
  lineHeight: typography.bodyMedium.lineHeight,
} as const;

const bookTitleBold = {
  fontFamily: fonts.derivedBold,
  fontWeight: '700' as const,
  fontSize: typography.bodyMedium.fontSize,
  lineHeight: typography.bodyMedium.lineHeight,
} as const;

function BookList() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [sources, setSources] = useState<Source[]>([]);

  useEffect(() => {
    void SourceRepository.findAll().then(setSources);
  }, []);

  const assigned = sources.filter((s) => (s.sort_order ?? 9999) < 9999);
  const primary = assigned
    .filter((s) => s.is_primary === 1)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (primary.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
      <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
        {t('about.primaryLiterature')}
      </Text>
      {primary.map((s) => (
        <Text key={s.id} style={[bookLine, { color: colors.onSurface }]}>
          {s.author ? `${s.author}: ` : ''}
          <Text style={[bookTitleBold, { color: colors.onSurface }]}>{s.title}</Text>
          {s.year ? ` (${s.year})` : ''}
        </Text>
      ))}
    </View>
  );
}

export default function AboutScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title={t('about.title')} onBackPress={() => router.back()} showUserMenu={false} />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsTitle, { color: colors.onSurface }]}>
            {t('about.welcomeTitle')}
          </Text>
          <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
            {t('about.welcomeP1')}
          </Text>
          <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
            <Text style={{ fontFamily: fonts.derivedItalic, fontStyle: 'italic' }}>{t('about.welcomeLeitmotivItalic')}</Text>{' '}
            {t('about.welcomeP2BeforeBook')}{' '}
            <Text style={{ fontFamily: fonts.derivedItalic, fontStyle: 'italic' }}>{t('about.welcomeBookTitle')}</Text>
            {' '}{t('about.welcomeP2AfterBook')}{' '}
            <Text style={{ fontFamily: fonts.derivedBold, fontWeight: '700' }}>{t('about.freedom')}</Text>,{' '}
            <Text style={{ fontFamily: fonts.derivedBold, fontWeight: '700' }}>{t('about.equality')}</Text>,{' '}
            <Text style={{ fontFamily: fonts.derivedBold, fontWeight: '700' }}>{t('about.fraternity')}</Text>{' '}
            {t('about.welcomeP2Rest')}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            {t('about.appInfo')}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            {t('about.version', { label: formatAppVersionLabel() })}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            {t('about.appPlatform')}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            {t('about.server')}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            {t('about.database')}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            {t('about.ragDatabase')}
          </Text>
          <TouchableOpacity onPress={() => Linking.openURL('https://github.com/cypherpunk-academy/ragrun')}>
            <Text style={[typography.bodyMedium, { color: colors.primary }]}>
              🐙 cypherpunk-academy/ragrun
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL('https://github.com/cypherpunk-academy/ragapp')}>
            <Text style={[typography.bodyMedium, { color: colors.primary }]}>
              🐙 cypherpunk-academy/ragapp
            </Text>
          </TouchableOpacity>
        </View>

        <BookList />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.m, gap: spacing.m, paddingBottom: spacing.xxl },
  card: { borderRadius: 12, padding: spacing.l, gap: spacing.m },
});
