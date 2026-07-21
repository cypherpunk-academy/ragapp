import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import TalkCard from '@/shared/components/TalkCard';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';

type Props = {
  onSelectTalk: (talkId: string) => void;
  /** Wenn gesetzt: nur Gespräche dieses Absatzes anzeigen. Sonst: allgemeine Gespräche. */
  contextParagraphId?: string | null;
};

/** GESPRÄCHE-Segment des Filo-Tabs: Suchmaske + Liste kontextgefilterter Gespräche. */
export default function GespraecheTab({ onSelectTalk, contextParagraphId }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const [allTalks, setAllTalks] = useState<Talk[]>([]);
  const [talkSnippets, setTalkSnippets] = useState<Map<string, Turn | null>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingTalks, setLoadingTalks] = useState(true);
  /** Nur angepinnte Gespräche (nur für allgemeine Gespräche wirksam). Default: an. */
  const [pinnedOnly, setPinnedOnly] = useState(true);

  useEffect(() => {
    setLoadingTalks(true);
    const obs = contextParagraphId
      ? TalkRepository.observeByParagraph(contextParagraphId)
      : TalkRepository.observeAll();

    const sub = obs.subscribe(async (talks) => {
      // Für allgemeine Gespräche: Absatz-Talks herausfiltern + ggf. pin-Filter anwenden.
      const base = contextParagraphId
        ? talks
        : talks.filter((t) => !t.kontextParagraphId && (!pinnedOnly || t.pinned));

      setAllTalks(base);
      setLoadingTalks(false);
      const snippets = new Map<string, Turn | null>();
      await Promise.all(
        base.map(async (t) => {
          const first = await TurnRepository.findFirstByTalk(t.id);
          snippets.set(t.id, first);
        }),
      );
      setTalkSnippets(new Map(snippets));
    });
    return () => sub.unsubscribe();
  }, [contextParagraphId, pinnedOnly]);

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
        <View style={styles.searchRow}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh, flex: 1 }]}>
            <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Gespräch suchen…"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[typography.bodyMedium, styles.searchInput, { color: colors.onSurface }]}
            />
          </View>
          {!contextParagraphId && (
            <TouchableOpacity
              onPress={() => setPinnedOnly((v) => !v)}
              style={[
                styles.pinButton,
                { backgroundColor: pinnedOnly ? colors.primaryContainer : colors.surfaceContainerHigh },
              ]}
              accessibilityLabel={pinnedOnly ? 'Alle Gespräche anzeigen' : 'Nur angepinnte anzeigen'}
            >
              <Ionicons
                name={pinnedOnly ? 'bookmark' : 'bookmark-outline'}
                size={18}
                color={pinnedOnly ? colors.onPrimaryContainer : colors.onSurfaceVariant}
              />
            </TouchableOpacity>
          )}
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  pinButton: {
    borderRadius: 12,
    padding: spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: { flex: 1 },
  listContent: { padding: spacing.m, gap: spacing.m },
});
