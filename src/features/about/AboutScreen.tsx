import React from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { withObservables } from '@nozbe/watermelondb/react';
import AppBar from '@/shared/components/AppBar';
import { lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { SourceRepository } from '@/data/repositories/SourceRepository';
import type Source from '@/data/db/models/Source';

const appVersion = Constants.expoConfig?.version ?? '1.0.0';

type BookListProps = { sources: Source[] };

function BookListInner({ sources }: BookListProps) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const primary = sources
    .filter((s) => s.isPrimary)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  const secondary = sources.filter((s) => !s.isPrimary);

  // Group secondary by author
  const byAuthor = new Map<string, Source[]>();
  for (const s of secondary) {
    const key = s.author || 'Unbekannt';
    const list = byAuthor.get(key) ?? [];
    list.push(s);
    byAuthor.set(key, list);
  }

  return (
    <>
      {primary.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            PRIMÄRLITERATUR
          </Text>
          {primary.map((s) => (
            <Text key={s.id} style={[typography.bodyMedium, { color: colors.onSurface }]}>
              {s.author ? `${s.author}: ` : ''}{s.title}{s.year ? ` (${s.year})` : ''}
            </Text>
          ))}
        </View>
      )}

      {byAuthor.size > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            SEKUNDÄRLITERATUR
          </Text>
          {Array.from(byAuthor.entries()).map(([author, books]) => (
            <View key={author} style={{ gap: 2 }}>
              <Text style={[typography.bodyMedium, { color: colors.onSurface, fontWeight: '600' }]}>
                {author}
              </Text>
              {books.map((b) => (
                <Text key={b.id} style={[typography.bodySmall, { color: colors.onSurfaceVariant, paddingLeft: spacing.m }]}>
                  {b.title}{b.year ? ` (${b.year})` : ''}
                </Text>
              ))}
            </View>
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
          <Text style={[typography.bodyMedium, { color: colors.onSurface, lineHeight: 22 }]}>
            Ich bin Philo von Freisinn. Hier geht es um Freiheit im Denken und Handeln
            — und darum, wo deine Freiheit aufhört und die des anderen beginnt.
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface, lineHeight: 22 }]}>
            Grundlage ist Rudolf Steiners Philosophie der Freiheit: handeln aus eigener
            Einsicht, leben lassen im Bewusstsein des fremden Wollens. Seine Dreigliederung
            zeigt, wie sich das im Sozialen fortsetzt — <Text style={{ fontWeight: '600' }}>Freiheit</Text> im
            Kulturleben, <Text style={{ fontWeight: '600' }}>Gleichheit</Text> im Recht
            und <Text style={{ fontWeight: '600' }}>Solidarität</Text> im Wirtschaftsleben,
            oder übertragen auf die Open Source / Free Software-Welt: uneingeschränkt über
            die eigenen Initiativen bestimmen, gleiche Regeln für alle, das Recht zu kopieren
            und ungehinderte Zusammenarbeit: genau das, was Free Software und Open Source ausmacht.
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            APP-INFO
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            Version: {appVersion} beta 1
          </Text>
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
