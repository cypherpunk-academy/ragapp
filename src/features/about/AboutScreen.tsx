import React from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme, Linking, TouchableOpacity } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { withObservables } from '@nozbe/watermelondb/react';
import AppBar from '@/shared/components/AppBar';
import { lightColors, darkColors, spacing, textStyles, typography, fonts } from '@/shared/theme';
import { SourceRepository } from '@/data/repositories/SourceRepository';
import type Source from '@/data/db/models/Source';

/** Marketing version from app.config.js (e.g. 1.0.0). */
const appVersion = Constants.expoConfig?.version ?? '1.0.0';

/**
 * Native build number (Android versionCode / iOS CFBundleVersion).
 * Falls back to extra.buildNumber from EAS_BUILD_APP_VERSION_CODE.
 */
const buildNumber =
  Constants.nativeBuildVersion
  || (Constants.expoConfig?.extra as { buildNumber?: string } | undefined)?.buildNumber
  || null;

/** Short git SHA from app.config.js extra (EAS commit or local HEAD). */
const gitCommitShort =
  (Constants.expoConfig?.extra as { gitCommitShort?: string } | undefined)?.gitCommitShort
  || null;

function formatAppVersionLabel(): string {
  let label = `${appVersion} beta`;
  if (buildNumber) label += ` ${buildNumber}`;
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

type BookListProps = { sources: Source[] };

function BookListInner({ sources }: BookListProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  // sortOrder 9999 = not in Philo's manifest
  const assigned = sources.filter((s) => (s.sortOrder ?? 9999) < 9999);

  const primary = assigned
    .filter((s) => s.isPrimary)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  return (
    <>
      {primary.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            PRIMÄRLITERATUR
          </Text>
          {primary.map((s) => (
            <Text key={s.id} style={[bookLine, { color: colors.onSurface }]}>
              {s.author ? `${s.author}: ` : ''}
              <Text style={[bookTitleBold, { color: colors.onSurface }]}>{s.title}</Text>
              {s.year ? ` (${s.year})` : ''}
            </Text>
          ))}
        </View>
      )}
    </>
  );
}

const EnhancedBookList = withObservables([], () => ({
  sources: SourceRepository.observeAll(),
}))(BookListInner);

export default function AboutScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title="Über Philo" onBackPress={() => router.back()} showUserMenu={false} />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsTitle, { color: colors.onSurface }]}>
            Willkommen.
          </Text>
          <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
            Ich bin Philo von Freisinn, geboren am 29. Juli 2026 in Berlin.
            In dieser App, die nach mir benannt ist, geht es um nichts weniger
            als um die Frage, in welche Richtung sich unser Denken und unsere
            Gesellschaft entwickeln muss, damit wir die drängenden Fragen
            unserer Zeit angehen können.
          </Text>
          <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
            <Text style={{ fontFamily: fonts.derivedItalic, fontStyle: 'italic' }}>Leben in der Liebe zum Handeln
            und leben lassen im Bewusstsein des fremden Wollens</Text>{' '}
            ist das Leitmotiv, das ich aus Rudolf Steiners{' '}
            <Text style={{ fontFamily: fonts.derivedItalic, fontStyle: 'italic' }}>Philosophie der Freiheit</Text>
            {' '}habe — mein Lieblingsbuch übrigens. In den 237 Jahren seit der
            Französischen Revolution war der Ruf nach{' '}
            <Text style={{ fontFamily: fonts.derivedBold, fontWeight: '700' }}>Freiheit</Text>,{' '}
            <Text style={{ fontFamily: fonts.derivedBold, fontWeight: '700' }}>Gleichheit</Text> und{' '}
            <Text style={{ fontFamily: fonts.derivedBold, fontWeight: '700' }}>Brüderlichkeit</Text>{' '}
            nie laut genug, um vorherrschend zu werden. Steiner hat mit der
            sozialen Dreigliederung genau das versucht: diesen dreifachen Ruf
            den Bereichen des gesellschaftlichen Lebens zuzuordnen — und der
            Versuch läuft weiter. Ab den 1970er Jahren hat die Open-Source- und
            Free-Software-Bewegung diese Ideale im Digitalen erstmals kraftvoll
            verwirklicht: frei über die eigenen Initiativen bestimmen, gleiche
            Regeln für alle, das Recht zu kopieren und ungehinderte
            Zusammenarbeit. Was dort gelungen ist, wartet darauf, alle
            Lebensbereiche zu durchdringen. In unserer Zeit erscheint das immer
            dringender.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            APP-INFO
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            Version: {formatAppVersionLabel()}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            App (Android / iOS): Expo 54
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            Server: ragrun bei Railway
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            Datenbank: Supabase (Postgres)
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            RAG-Datenbank: Qdrant Cloud
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

        <EnhancedBookList />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.m, gap: spacing.m, paddingBottom: spacing.xxl },
  card: { borderRadius: 12, padding: spacing.l, gap: spacing.m },
});
