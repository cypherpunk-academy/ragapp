import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { ragrunApi } from '@/data/services/ragrunApi';
import { useReading } from '@/shared/contexts/ReadingContext';
import { entityKindFromSearchResult } from '@/shared/theme/entityCards';
import TalkCard from '@/shared/components/TalkCard';
import EntityResultCard from '@/shared/components/EntityResultCard';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';
import type { SearchResult } from '@/shared/types/ragrun';

type ScoredTalk = { type: 'talk'; talk: Talk; snippetTurn: Turn | null; score: number };
type ScoredChunk = { type: 'chunk'; result: SearchResult; score: number };
type ScoredItem = ScoredTalk | ScoredChunk;

/** Demo-Daten für alle Karten-Typen im __DEV__-Modus (ohne ragrun-Backend). */
const DEV_DEMO_RESULTS: SearchResult[] = __DEV__ ? [
  {
    chunk_id: 'demo-begriff-1',
    source_id: 'philo-von-freisinn',
    title: 'Philosophie von Freisinn',
    segment_title: 'Grundbegriffe',
    snippet: 'Neigung: Wenn die Handlung aus dem Willen des Handelnden hervorgeht und nicht aus äußerem Zwang, spricht man von Neigung. Schopenhauer unterscheidet zwei Arten der Motivation...',
    score: 0.82,
    chunk_type: 'begriff',
    source_type: 'buch',
  },
  {
    chunk_id: 'demo-book-1',
    source_id: 'rebel-code',
    title: 'Rebel Code: Linux and the Open Source Revolution',
    segment_title: 'The Origins of Linux',
    snippet: 'Guido van Rossum created Python in the late 1980s, drawing inspiration from ABC and Modula-3. His goal was a language that was easy to read and write...',
    score: 0.74,
    chunk_type: 'book',
    source_type: 'buch',
  },
  {
    chunk_id: 'demo-summary-1',
    source_id: 'rudolf-steiner-vortrag',
    title: 'Vortrag über die sittliche Phantasie',
    segment_title: 'Kapitel 9 — Zusammenfassung',
    snippet: 'Zusammenfassung: Steiner erläutert in diesem Vortrag die Bedeutung der sittlichen Phantasie als Quelle freier sittlicher Handlungen. Der Mensch erschafft sich selbst seine moralischen Ziele...',
    score: 0.71,
    chunk_type: 'chapter_summary',
    source_type: 'vortrag',
  },
  {
    chunk_id: 'demo-quote-1',
    source_id: 'assange-collected',
    title: 'Julian Assange: Collected Writings',
    segment_title: 'State and Knowledge',
    snippet: '"The internet, our greatest tool of emancipation, has been transformed into the most dangerous facilitator of totalitarianism we have ever seen." — Julian Assange',
    score: 0.68,
    chunk_type: 'quote',
    source_type: 'buch',
  },
  {
    chunk_id: 'demo-talk-1',
    source_id: 'philo-von-freisinn',
    title: 'Gespräch: Arbeit als Ware',
    segment_title: 'Philosophie von Freisinn',
    snippet: 'Wenn Arbeit als Ware behandelt wird, verliert der Mensch seinen Selbstzweck. Marx sieht darin die Entfremdung: Der Arbeiter wird zum Mittel fremder Zwecke...',
    score: 0.65,
    chunk_type: 'talk',
    source_type: 'gespraech',
  },
  {
    chunk_id: 'demo-typology-1',
    source_id: 'philo-von-freisinn',
    title: 'Motive sittlichen Handelns',
    segment_title: 'Sittliche Phantasie',
    snippet: 'Typologie der Motive sittlichen Handelns nach Rudolf Steiner: (1) Egoismus, (2) Konformismus, (3) Moralischer Intuitionismus, (4) Sittliche Phantasie als höchste Stufe...',
    score: 0.60,
    chunk_type: 'typology',
    source_type: 'buch',
  },
] : [];

/** Relevanz-Score für einen Talk bei gegebener Query (0–1). */
function talkScore(talk: Talk, q: string): number {
  if (!q) return 0.5;
  const title = talk.title?.toLowerCase() ?? '';
  const summary = talk.summary?.toLowerCase() ?? '';
  if (title === q) return 0.95;
  if (title.startsWith(q)) return 0.85;
  if (title.includes(q)) return 0.75;
  if (summary.includes(q)) return 0.55;
  return 0;
}

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { openConversationDetail, navigateToRead } = useReading();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [allTalks, setAllTalks] = useState<Talk[]>([]);
  const [snippets, setSnippets] = useState<Map<string, Turn | null>>(new Map());
  const [talksLoading, setTalksLoading] = useState(true);

  const [chunkResults, setChunkResults] = useState<SearchResult[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [chunksOffline, setChunksOffline] = useState(false);
  const searchCtrlRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Debounce Eingabe 300 ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Lokale Talks beobachten
  useEffect(() => {
    const sub = TalkRepository.observeAll().subscribe(async (talks) => {
      setAllTalks(talks);
      setTalksLoading(false);
      const map = new Map<string, Turn | null>();
      await Promise.all(talks.map(async (t) => {
        const first = await TurnRepository.findFirstByTalk(t.talkId);
        map.set(t.talkId, first);
      }));
      setSnippets(new Map(map));
    });
    return () => sub.unsubscribe();
  }, []);

  // Ragrun-Suche
  useEffect(() => {
    const ctrl = { cancelled: false };
    searchCtrlRef.current = ctrl;

    if (!debouncedQuery.trim()) {
      setChunkResults([]);
      setChunksLoading(false);
      setChunksOffline(false);
      return;
    }

    if (!ragrunApi.isAvailable()) {
      if (__DEV__ && DEV_DEMO_RESULTS.length > 0) {
        setChunkResults(DEV_DEMO_RESULTS);
      } else {
        setChunksOffline(true);
      }
      setChunksLoading(false);
      return;
    }

    setChunksLoading(true);
    setChunksOffline(false);

    ragrunApi.search({ query: debouncedQuery, limit: 20 })
      .then((resp) => {
        if (!ctrl.cancelled) {
          setChunkResults(resp.results);
          setChunksLoading(false);
        }
      })
      .catch(() => {
        if (!ctrl.cancelled) {
          setChunksOffline(true);
          setChunksLoading(false);
          setChunkResults([]);
        }
      });

    return () => { ctrl.cancelled = true; };
  }, [debouncedQuery]);

  // Gemischte, relevanzbasierte Liste — leer wenn kein Suchbegriff
  const sortedItems = useMemo((): ScoredItem[] => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return [];

    const talkItems: ScoredTalk[] = allTalks
      .map((talk) => ({
        type: 'talk' as const,
        talk,
        snippetTurn: snippets.get(talk.talkId) ?? null,
        score: talkScore(talk, q),
      }))
      .filter((item) => item.score > 0);

    const chunkItems: ScoredChunk[] = chunkResults.map((result) => ({
      type: 'chunk' as const,
      result,
      score: result.score,
    }));

    return [...talkItems, ...chunkItems].sort((a, b) => b.score - a.score);
  }, [allTalks, snippets, chunkResults, debouncedQuery]);

  const handleChunkPress = useCallback((result: SearchResult) => {
    if (result.paragraph_id) {
      navigateToRead({ sourceId: result.source_id, segmentIndex: null, paragraphId: result.paragraph_id });
    }
  }, [navigateToRead]);

  const renderItem = useCallback(({ item }: { item: ScoredItem }) => {
    if (item.type === 'talk') {
      return (
        <TalkCard
          talk={item.talk}
          snippetTurn={item.snippetTurn}
          onPress={() => openConversationDetail(item.talk.talkId, null)}
        />
      );
    }
    const kind = entityKindFromSearchResult(item.result);
    return (
      <EntityResultCard
        kind={kind}
        title={item.result.title ?? item.result.source_id}
        subtitle={item.result.segment_title}
        snippet={item.result.snippet}
        onPress={item.result.paragraph_id ? () => handleChunkPress(item.result) : undefined}
      />
    );
  }, [openConversationDetail, handleChunkPress]);

  const isLoading = talksLoading || chunksLoading;
  const isEmpty = !isLoading && sortedItems.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Suchleiste */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
        <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Gespräche und Textkorpus durchsuchen…"
          placeholderTextColor={colors.onSurfaceVariant}
          style={[typography.bodyLarge, styles.searchInput, { color: colors.onSurface }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
          autoCorrect={false}
        />
        {chunksLoading && (
          <ActivityIndicator size="small" color={colors.onSurfaceVariant} />
        )}
        {chunksOffline && !chunksLoading && (
          <Ionicons name="cloud-offline-outline" size={16} color={colors.onSurfaceVariant} />
        )}
      </View>

      {talksLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            {debouncedQuery
              ? 'Keine Treffer gefunden.'
              : 'Suche nach Gesprächen, Begriffen, Zitaten\nund Stellen im Textkorpus.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={sortedItems}
          keyExtractor={(item, i) =>
            item.type === 'talk' ? item.talk.talkId : `chunk-${item.result.chunk_id}-${i}`
          }
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    margin: spacing.m,
    gap: spacing.s,
  },
  searchInput: { flex: 1 },
  listContent: { paddingHorizontal: spacing.m, paddingBottom: spacing.xl },
  separator: { height: spacing.m },
});
