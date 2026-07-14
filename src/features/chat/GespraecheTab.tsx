import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import TalkCard from '@/shared/components/TalkCard';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';

type Props = {
  onSelectTalk: (talkId: string) => void;
};

/** GESPRÄCHE-Segment des Filo-Tabs: Suchmaske + Liste aller Gespräche. */
export default function GespraecheTab({ onSelectTalk }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const [allTalks, setAllTalks] = useState<Talk[]>([]);
  const [talkSnippets, setTalkSnippets] = useState<Map<string, Turn | null>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTalks, setLoadingTalks] = useState(true);

  useEffect(() => {
    const sub = TalkRepository.observeAll().subscribe(async (talks) => {
      setAllTalks(talks);
      setLoadingTalks(false);
      const snippets = new Map<string, Turn | null>();
      await Promise.all(
        talks.map(async (t) => {
          const first = await TurnRepository.findFirstByTalk(t.id);
          snippets.set(t.id, first);
        }),
      );
      setTalkSnippets(new Map(snippets));
    });
    return () => sub.unsubscribe();
  }, []);

  const filteredTalks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allTalks;
    return allTalks.filter(
      (t) => t.title?.toLowerCase().includes(q) || t.summary?.toLowerCase().includes(q),
    );
  }, [allTalks, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.selectorBody}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Gespräch suchen…"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[typography.bodyMedium, styles.searchInput, { color: colors.onSurface }]}
          />
        </View>
      </View>

      {loadingTalks ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filteredTalks.length === 0 ? (
        <View style={styles.center}>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            {searchQuery ? 'Keine Gespräche gefunden.' : 'Noch keine Gespräche vorhanden.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredTalks}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TalkCard
              talk={item}
              snippetTurn={talkSnippets.get(item.id) ?? null}
              onPress={() => onSelectTalk(item.id)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  selectorBody: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    paddingTop: spacing.s,
    gap: spacing.s,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  searchInput: { flex: 1 },
  listContent: { padding: spacing.m, gap: spacing.m },
});
