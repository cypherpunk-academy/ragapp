import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, useColorScheme,
  ActivityIndicator, TouchableOpacity, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/lib/color';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { ragrunApi } from '@/data/services/ragrunApi';
import { useReading } from '@/shared/contexts/ReadingContext';
import { entityKindFromSearchResult, getEntityCardStyle, type EntityKind } from '@/shared/theme/entityCards';
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
    segment_title: 'Grundbegriff',
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

const ALL_FILTER_KINDS: { kind: EntityKind; label: string }[] = [
  { kind: 'chunk_buch', label: 'Buch' },
  { kind: 'chunk_vortrag', label: 'Vortrag' },
  { kind: 'kapitel_zusammenfassung', label: 'Zusammenfassung' },
  { kind: 'begriff', label: 'Begriff' },
  { kind: 'zitat', label: 'Zitat' },
  { kind: 'typology', label: 'Typologie' },
  { kind: 'chunk_gespraech', label: 'Gespräch' },
  { kind: 'talk', label: 'Gespräch (lokal)' },
];

const DEFAULT_KINDS: EntityKind[] = ['chunk_buch', 'chunk_vortrag', 'kapitel_zusammenfassung'];

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
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const { openConversationDetail, navigateToRead } = useReading();

  const [query, setQuery] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedKinds, setSelectedKinds] = useState<Set<EntityKind>>(
    new Set(DEFAULT_KINDS),
  );
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

  const toggleKind = useCallback((kind: EntityKind) => {
    setSelectedKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) { next.delete(kind); } else { next.add(kind); }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedKinds((prev) =>
      prev.size === ALL_FILTER_KINDS.length
        ? new Set(DEFAULT_KINDS)
        : new Set(ALL_FILTER_KINDS.map((f) => f.kind)),
    );
  }, []);

  // Nach Typ gefilterte Ergebnisliste
  const filteredItems = useMemo(() => {
    if (selectedKinds.size === ALL_FILTER_KINDS.length) return sortedItems;
    return sortedItems.filter((item) => {
      if (item.type === 'talk') return selectedKinds.has('talk');
      return selectedKinds.has(entityKindFromSearchResult(item.result));
    });
  }, [sortedItems, selectedKinds]);

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
  const isEmpty = !isLoading && filteredItems.length === 0;
  const isFiltered = selectedKinds.size < ALL_FILTER_KINDS.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Suchleiste */}
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
        <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Bücher, Vorträge durchsuchen…"
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
        {/* Filter-Button */}
        <TouchableOpacity
          onPress={() => setFilterOpen((v) => !v)}
          style={styles.filterButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="filter"
            size={18}
            color={filterOpen || isFiltered ? colors.primary : colors.onSurfaceVariant}
          />
          {isFiltered && (
            <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.filterBadgeText, { color: colors.onPrimary }]}>
                {selectedKinds.size}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filter-Dropdown */}
      {filterOpen && (
        <>
          <TouchableOpacity
            style={styles.filterBackdrop}
            onPress={() => setFilterOpen(false)}
            activeOpacity={1}
          />
          <View style={[styles.filterDropdown, {
            backgroundColor: colors.surfaceContainerHigh,
            shadowColor: colors.shadow,
          }]}>
            {/* Alle-Zeile */}
            <TouchableOpacity onPress={toggleAll} style={styles.filterRow}>
              <View style={[
                styles.checkbox,
                {
                  borderColor: selectedKinds.size === ALL_FILTER_KINDS.length
                    ? colors.primary : colors.outlineVariant,
                  backgroundColor: selectedKinds.size === ALL_FILTER_KINDS.length
                    ? colors.primary : 'transparent',
                },
              ]}>
                {selectedKinds.size === ALL_FILTER_KINDS.length && (
                  <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                )}
              </View>
              <Text style={[styles.filterLabel, { color: colors.onSurface }]}>Alle</Text>
            </TouchableOpacity>
            <View style={[styles.filterDivider, { backgroundColor: colors.outlineVariant }]} />
            {/* Typ-Zeilen */}
            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              {ALL_FILTER_KINDS.map(({ kind, label }) => {
                const cs = getEntityCardStyle(colors, kind, isDark);
                const checked = selectedKinds.has(kind);
                return (
                  <TouchableOpacity key={kind} onPress={() => toggleKind(kind)} style={styles.filterRow}>
                    <View style={[
                      styles.checkbox,
                      {
                        borderColor: checked ? cs.accentColor : colors.outlineVariant,
                        backgroundColor: checked
                          ? colorWithAlpha(cs.accentColor, 0.15) : 'transparent',
                      },
                    ]}>
                      {checked && <Ionicons name="checkmark" size={12} color={cs.accentColor} />}
                    </View>
                    <Text style={[styles.filterLabel, { color: checked ? cs.accentColor : colors.onSurfaceVariant, letterSpacing: 0.6 }]}>
                      {label.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </>
      )}

      {talksLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isEmpty ? (
        <View style={styles.center}>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            {debouncedQuery
              ? 'Keine Treffer gefunden.'
              : 'Bücher, Vorträge, Gespräche,\nBegriffe und Zitate durchsuchen.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
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
  // Filter
  filterButton: { position: 'relative' },
  filterBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  filterBadgeText: { fontSize: 10, fontWeight: '700', lineHeight: 14 },
  filterBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
  },
  filterDropdown: {
    position: 'absolute',
    top: 70,
    left: spacing.m,
    right: spacing.m,
    zIndex: 100,
    borderRadius: 14,
    paddingVertical: spacing.xs,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.14,
    shadowRadius: 12,
    elevation: 8,
  },
  filterScroll: { maxHeight: 300 },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: 10,
    gap: spacing.s,
  },
  filterDivider: { height: 1, marginHorizontal: spacing.m, marginVertical: spacing.xs },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterLabel: { fontSize: 13, fontWeight: '600' },
});
