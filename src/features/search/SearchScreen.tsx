import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, StyleSheet, useColorScheme, Platform,
  ActivityIndicator, TouchableOpacity, ScrollView,
  type NativeSyntheticEvent, type TextInputContentSizeChangeEventData,
  type TextLayoutEventData, type TextStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppBar from '@/shared/components/AppBar';
import { lightColors, darkColors, spacing, typography, textStyles, fonts, fontSize as tokenFontSize, scaleSize } from '@/shared/theme';
import { colorWithAlpha } from '@/shared/lib/color';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { ragrunApi } from '@/data/services/ragrunApi';
import { useReading } from '@/shared/contexts/ReadingContext';
import { entityKindFromSearchResult, getEntityCardStyle, type EntityKind } from '@/shared/theme/entityCards';
import SearchHitRow from '@/shared/components/SearchHitRow';
import { useSearchHitNavigation } from '@/shared/hooks/useSearchHitNavigation';
import TalkCard from '@/shared/components/TalkCard';
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
    title: 'Neigung',
    segment_title: 'Grundbegriff',
    snippet: 'Neigung: Wenn die Handlung aus dem Willen des Handelnden hervorgeht und nicht aus äußerem Zwang, spricht man von Neigung. Schopenhauer unterscheidet zwei Arten der Motivation...',
    text: 'Neigung: Wenn die Handlung aus dem Willen des Handelnden hervorgeht und nicht aus äußerem Zwang, spricht man von Neigung. Schopenhauer unterscheidet zwei Arten der Motivation und weitere feine Nuancen.',
    score: 0.82,
    chunk_type: 'begriff',
    source_type: 'buch',
    author: 'Schopenhauer',
    book_title: 'Philosophie von Freisinn',
  },
  {
    chunk_id: 'demo-book-1',
    source_id: 'rebel-code',
    title: 'Rebel Code: Linux and the Open Source Revolution',
    book_title: 'Rebel Code: Linux and the Open Source Revolution',
    segment_title: 'The Origins of Linux',
    author: 'Glyn Moody',
    snippet: 'Guido van Rossum created Python in the late 1980s, drawing inspiration from ABC and Modula-3. His goal was a language that was easy to read and write...',
    text: 'Guido van Rossum created Python in the late 1980s, drawing inspiration from ABC and Modula-3. His goal was a language that was easy to read and write for programmers and newcomers alike.',
    score: 0.74,
    chunk_type: 'book',
    source_type: 'buch',
    paragraph_id: 'demo-book-para-1',
  },
  {
    chunk_id: 'demo-summary-1',
    source_id: 'rudolf-steiner-vortrag',
    title: 'Vortrag über die sittliche Phantasie',
    segment_title: 'Kapitel 9 — Zusammenfassung',
    author: 'Rudolf Steiner',
    venue: 'Dornach',
    lecture_date: '1920-05-14',
    snippet: 'Zusammenfassung: Steiner erläutert in diesem Vortrag die Bedeutung der sittlichen Phantasie als Quelle freier sittlicher Handlungen. Der Mensch erschafft sich selbst seine moralischen Ziele...',
    text: 'Zusammenfassung: Steiner erläutert in diesem Vortrag die Bedeutung der sittlichen Phantasie als Quelle freier sittlicher Handlungen. Der Mensch erschafft sich selbst seine moralischen Ziele und verwirklicht sie durch moralische Intuition.',
    score: 0.71,
    chunk_type: 'chapter_summary',
    source_type: 'vortrag',
  },
  {
    chunk_id: 'demo-quote-1',
    source_id: 'assange-collected',
    title: 'Julian Assange: Collected Writings',
    book_title: 'Julian Assange: Collected Writings',
    segment_title: 'State and Knowledge',
    quote_author: 'Julian Assange',
    quote_text:
      '"The internet, our greatest tool of emancipation, has been transformed into the most dangerous facilitator of totalitarianism we have ever seen."',
    snippet:
      '"The internet, our greatest tool of emancipation, has been transformed into the most dangerous facilitator of totalitarianism we have ever seen." — Julian Assange',
    score: 0.68,
    chunk_type: 'quote',
    source_type: 'buch',
    paragraph_id: 'demo-quote-para-1',
  },
  {
    chunk_id: 'demo-talk-1',
    source_id: 'philo-von-freisinn',
    title: 'Gespräch: Arbeit als Ware',
    segment_title: 'Philosophie von Freisinn',
    author: 'Rudolf Steiner',
    book_title: 'Philosophie der Freiheit',
    snippet: 'Wenn Arbeit als Ware behandelt wird, verliert der Mensch seinen Selbstzweck. Marx sieht darin die Entfremdung: Der Arbeiter wird zum Mittel fremder Zwecke...',
    text: 'Wenn Arbeit als Ware behandelt wird, verliert der Mensch seinen Selbstzweck. Marx sieht darin die Entfremdung: Der Arbeiter wird zum Mittel fremder Zwecke und verliert die Bedeutung seiner eigenen Tätigkeit.',
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
    text: 'Typologie der Motive sittlichen Handelns nach Rudolf Steiner: (1) Egoismus, (2) Konformismus, (3) Moralischer Intuitionismus, (4) Sittliche Phantasie als höchste Stufe moralischen Handelns.',
    score: 0.60,
    chunk_type: 'typology',
    source_type: 'buch',
    author: 'Rudolf Steiner',
    book_title: 'Philosophie der Freiheit',
  },
  {
    chunk_id: 'demo-notiz-1',
    source_id: '',
    title: 'Gedanke zur Willensfreiheit',
    segment_title: 'Abschnitt 3',
    snippet: 'Der freie Wille lässt sich nicht auf kausale Ketten reduzieren, ohne das Phänomen zu verfehlen. Kant trennt intelligiblen und empirischen Charakter...',
    text: 'Der freie Wille lässt sich nicht auf kausale Ketten reduzieren, ohne das Phänomen zu verfehlen. Kant trennt intelligiblen und empirischen Charakter. Die praktische Vernunft setzt sich über Naturgesetze hinweg.',
    score: 0.55,
    chunk_type: 'notiz',
    source_type: 'buch',
    note_author: 'Michael',
    note_date: '2026-05-18',
    author: 'Rudolf Steiner',
    book_title: 'Philosophie der Freiheit',
    paragraph_id: 'demo-para-notiz',
  },
] : [];

const RAGRUN_COLLECTION = 'philo-von-freisinn';

/** Maps UI EntityKind to ragrun API `types` filter values. Local-only kinds (talk, notiz) have no mapping. */
const ENTITY_KIND_TO_API_TYPE: Partial<Record<EntityKind, string>> = {
  chunk_buch: 'text',
  chunk_vortrag: 'text',
  chunk_gespraech: 'text',
  begriff: 'concept',
  typology: 'concept',
  zitat: 'quote',
  kapitel_zusammenfassung: 'chapter_summary',
};

/** Zusammengefasste Filter-Gruppen. */
type FilterGroup = 'texte' | 'zusammenfassungen' | 'begriffe' | 'zitate' | 'gespraeche' | 'notizen';

const FILTER_GROUPS: { group: FilterGroup; label: string; subtitle?: string; kinds: EntityKind[] }[] = [
  { group: 'texte',            label: 'Bücher / Vorträge', kinds: ['chunk_buch', 'chunk_vortrag'] },
  { group: 'zusammenfassungen', label: 'Zusammenfassungen', kinds: ['kapitel_zusammenfassung'] },
  { group: 'begriffe',         label: 'Begriffe',           kinds: ['begriff', 'typology'] },
  { group: 'zitate',           label: 'Zitate',             kinds: ['zitat'] },
  { group: 'gespraeche',       label: 'Gespräche',          kinds: ['talk', 'chunk_gespraech'] },
  { group: 'notizen',          label: 'Notizen',            kinds: ['notiz'] },
];

/** Startauswahl: Bücher/Vorträge, Zusammenfassungen, Begriffe, Zitate (ohne Gespräche/Notizen). */
const DEFAULT_GROUPS: FilterGroup[] = FILTER_GROUPS.slice(0, 4).map(({ group }) => group);
const ALL_GROUPS: FilterGroup[] = FILTER_GROUPS.map(({ group }) => group);

/** Alle EntityKinds der gewählten Gruppen als Set. */
function kindsForGroups(selectedGroups: Set<FilterGroup>): Set<EntityKind> {
  const kinds = new Set<EntityKind>();
  for (const { group, kinds: gk } of FILTER_GROUPS) {
    if (selectedGroups.has(group)) gk.forEach((k) => kinds.add(k));
  }
  return kinds;
}

/**
 * Returns the API `types` array for the given selected groups, or undefined when all types should be searched.
 * Returns an empty array when only local-only groups (gespraeche, notizen) are selected.
 */
function computeApiTypes(selectedGroups: Set<FilterGroup>): string[] | undefined {
  if (selectedGroups.size >= FILTER_GROUPS.length) return undefined;
  const kinds = kindsForGroups(selectedGroups);
  const types = new Set<string>();
  for (const kind of kinds) {
    const t = ENTITY_KIND_TO_API_TYPE[kind];
    if (t) types.add(t);
  }
  return Array.from(types);
}

/** Suchfeld: mehrzeilig (RAG-Anfragen), Special Elite (Figma §11.3). */
const SEARCH_INPUT_LINE_HEIGHT = scaleSize(20);
const SEARCH_INPUT_MAX_LINES = 7;
const SEARCH_INPUT_MIN_HEIGHT = SEARCH_INPUT_LINE_HEIGHT;
const SEARCH_INPUT_MAX_HEIGHT = SEARCH_INPUT_LINE_HEIGHT * SEARCH_INPUT_MAX_LINES;
const SEARCH_BAR_ICON_SIZE = scaleSize(18);

const SEARCH_INPUT_TEXT_STYLE: TextStyle = {
  fontFamily: fonts.derived,
  fontSize: tokenFontSize.sm,
  lineHeight: SEARCH_INPUT_LINE_HEIGHT,
  fontWeight: '400',
};

const SEARCH_INPUT_WEB_STYLE: TextStyle | undefined = Platform.OS === 'web'
  ? {
    width: '100%',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    overflow: 'hidden',
    resize: 'none',
  } as TextStyle
  : undefined;

function clampSearchInputHeight(height: number): number {
  return Math.min(
    SEARCH_INPUT_MAX_HEIGHT,
    Math.max(SEARCH_INPUT_MIN_HEIGHT, height),
  );
}

function selectedScopeTerms(selectedGroups: Set<FilterGroup>): string[] {
  return FILTER_GROUPS
    .filter(({ group }) => selectedGroups.has(group))
    .map(({ label }) => label);
}

type SearchScopeParts = { prefix: string; suffix: string };

/** Such-Hinweis: aktive Filter + „durchsuchen” (einheitlicher Stil). */
function searchScopeParts(selectedGroups: Set<FilterGroup>): SearchScopeParts {
  const terms = selectedScopeTerms(selectedGroups);
  if (terms.length === 0) {
    return { prefix: 'Typ auswählen und', suffix: ' durchsuchen…' };
  }
  return { prefix: terms.join(', '), suffix: ' durchsuchen…' };
}

const SEARCH_EMPTY_HINT: SearchScopeParts = {
  prefix: 'Stellen Sie eine Frage in eigenen Worten.',
  suffix: '\nDie KI findet passende Texte – auch ohne das exakte Wort.',
};

function searchHintStyle(baseColor: string, baseStyle: TextStyle): TextStyle {
  const flat = StyleSheet.flatten(baseStyle);
  const baseSize = typeof flat.fontSize === 'number' ? flat.fontSize : 16;
  const baseLineHeight = typeof flat.lineHeight === 'number' ? flat.lineHeight : 24;
  return {
    color: colorWithAlpha(baseColor, 0.4),
    fontSize: baseSize * 1.25,
    lineHeight: baseLineHeight * 1.25,
  };
}

function ScopeSearchHint({
  prefix,
  suffix,
  baseColor,
  style,
  textAlign = 'left',
  numberOfLines,
}: SearchScopeParts & {
  baseColor: string;
  style?: TextStyle;
  textAlign?: 'left' | 'center';
  numberOfLines?: number;
}) {
  const base: TextStyle = { color: baseColor, textAlign, ...style };
  if (!suffix) {
    return (
      <Text style={base} numberOfLines={numberOfLines}>
        {prefix}
      </Text>
    );
  }
  return (
    <Text style={[base, searchHintStyle(baseColor, base)]} numberOfLines={numberOfLines}>
      {prefix}
      {suffix}
    </Text>
  );
}

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
  const { openConversationDetail } = useReading();

  const [query, setQuery] = useState('');
  const [inputHeight, setInputHeight] = useState(SEARCH_INPUT_MIN_HEIGHT);
  const [inputWidth, setInputWidth] = useState(0);
  const [searchBarLayout, setSearchBarLayout] = useState({ y: 0, height: 0 });
  const searchInputRef = useRef<TextInput>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState<Set<FilterGroup>>(
    new Set(DEFAULT_GROUPS),
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

  const applyInputHeight = useCallback((height: number) => {
    const next = clampSearchInputHeight(height);
    setInputHeight((prev) => (prev === next ? prev : next));
  }, []);

  const handleSearchMeasureTextLayout = useCallback(
    (e: NativeSyntheticEvent<TextLayoutEventData>) => {
      const lineCount = Math.max(1, e.nativeEvent.lines.length);
      applyInputHeight(lineCount * SEARCH_INPUT_LINE_HEIGHT);
    },
    [applyInputHeight],
  );

  const handleSearchInputContentSizeChange = useCallback(
    (e: NativeSyntheticEvent<TextInputContentSizeChangeEventData>) => {
      if (Platform.OS === 'web') return;
      applyInputHeight(e.nativeEvent.contentSize.height);
    },
    [applyInputHeight],
  );

  const measureSearchInputOnWeb = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const node = searchInputRef.current as unknown as HTMLElement | null;
    if (!node) return;
    requestAnimationFrame(() => {
      node.style.height = '0px';
      applyInputHeight(node.scrollHeight);
    });
  }, [applyInputHeight]);

  useEffect(() => {
    measureSearchInputOnWeb();
  }, [query, inputWidth, measureSearchInputOnWeb]);

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
        const first = await TurnRepository.findFirstByTalk(t.id);
        map.set(t.id, first);
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

    const apiTypes = computeApiTypes(selectedGroups);

    // If only local-only groups (gespraeche, notizen) are selected, skip API call
    if (apiTypes !== undefined && apiTypes.length === 0) {
      setChunkResults([]);
      setChunksLoading(false);
      setChunksOffline(false);
      return;
    }

    setChunksLoading(true);
    setChunksOffline(false);

    ragrunApi.search({
      query: debouncedQuery,
      limit: 20,
      collection: RAGRUN_COLLECTION,
      ...(apiTypes !== undefined ? { types: apiTypes } : {}),
    })
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
  }, [debouncedQuery, selectedGroups]);

  // Gemischte, relevanzbasierte Liste — leer wenn kein Suchbegriff
  const sortedItems = useMemo((): ScoredItem[] => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return [];

    const talkItems: ScoredTalk[] = allTalks
      .map((talk) => ({
        type: 'talk' as const,
        talk,
        snippetTurn: snippets.get(talk.id) ?? null,
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

  const toggleGroup = useCallback((group: FilterGroup) => {
    setSelectedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) { next.delete(group); } else { next.add(group); }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedGroups((prev) =>
      prev.size === FILTER_GROUPS.length
        ? new Set<FilterGroup>()
        : new Set(ALL_GROUPS),
    );
  }, []);

  // Nach Typ gefilterte Ergebnisliste
  const filteredItems = useMemo(() => {
    if (selectedGroups.size >= FILTER_GROUPS.length) return sortedItems;
    const effectiveKinds = kindsForGroups(selectedGroups);
    return sortedItems.filter((item) => {
      if (item.type === 'talk') return effectiveKinds.has('talk');
      const kind = entityKindFromSearchResult(item.result);
      return effectiveKinds.has(kind);
    });
  }, [sortedItems, selectedGroups]);

  const handleSearchNavigation = useSearchHitNavigation();

  const renderItem = useCallback(({ item }: { item: ScoredItem }) => {
    if (item.type === 'talk') {
      return (
        <TalkCard
          talk={item.talk}
          snippetTurn={item.snippetTurn}
          onPress={() => openConversationDetail(item.talk.id, null)}
        />
      );
    }
    return <SearchHitRow result={item.result} onNavigate={handleSearchNavigation} />;
  }, [openConversationDetail, handleSearchNavigation]);

  const isLoading = talksLoading || chunksLoading;
  const isEmpty = !isLoading && filteredItems.length === 0;
  const isFiltered = selectedGroups.size < FILTER_GROUPS.length;
  const scopeParts = useMemo(
    () => searchScopeParts(selectedGroups),
    [selectedGroups],
  );
  const scopeEmptyParts = SEARCH_EMPTY_HINT;
  const searchPlaceholderText = `${scopeParts.prefix}${scopeParts.suffix}`;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBar title="KI-Suche" />
      {/* Suchleiste */}
      <View
        style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}
        onLayout={(e) => {
          const { y, height } = e.nativeEvent.layout;
          setSearchBarLayout({ y, height });
        }}
      >
        <Ionicons
          name="search"
          size={SEARCH_BAR_ICON_SIZE}
          color={colors.onSurfaceVariant}
          style={styles.searchBarIcon}
        />
        <View
          style={[styles.searchInputWrap, { height: inputHeight }]}
          onLayout={(e) => setInputWidth(e.nativeEvent.layout.width)}
        >
          {inputWidth > 0 && (
            <Text
              pointerEvents="none"
              accessible={false}
              importantForAccessibility="no-hide-descendants"
              style={[
                SEARCH_INPUT_TEXT_STYLE,
                styles.searchMeasureText,
                { width: inputWidth },
              ]}
              onTextLayout={handleSearchMeasureTextLayout}
            >
              {query.length > 0 ? query : ' '}
            </Text>
          )}
          {!query && (
            <View style={styles.placeholderOverlay} pointerEvents="none">
              <Text style={[SEARCH_INPUT_TEXT_STYLE, { color: colors.onSurfaceVariant }]}>
                {searchPlaceholderText}
              </Text>
            </View>
          )}
          <TextInput
            ref={searchInputRef}
            value={query}
            onChangeText={setQuery}
            placeholder=""
            multiline
            scrollEnabled={inputHeight >= SEARCH_INPUT_MAX_HEIGHT}
            textAlignVertical="top"
            onContentSizeChange={handleSearchInputContentSizeChange}
            style={[
              SEARCH_INPUT_TEXT_STYLE,
              SEARCH_INPUT_WEB_STYLE,
              styles.searchInput,
              { color: colors.onSurface, height: inputHeight },
            ]}
            returnKeyType="default"
            blurOnSubmit={false}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>
        {chunksLoading && (
          <ActivityIndicator
            size="small"
            color={colors.onSurfaceVariant}
            style={styles.searchBarTrailingIcon}
          />
        )}
        {chunksOffline && !chunksLoading && (
          <Ionicons
            name="cloud-offline-outline"
            size={16}
            color={colors.onSurfaceVariant}
            style={styles.searchBarTrailingIcon}
          />
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
                {selectedGroups.size}
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
            top: searchBarLayout.y + searchBarLayout.height + spacing.xs,
            backgroundColor: colors.surfaceContainerHigh,
            shadowColor: colors.shadow,
          }]}>
            {/* Alle-Zeile */}
            <TouchableOpacity onPress={toggleAll} style={styles.filterRow}>
              <View style={[
                styles.checkbox,
                {
                  borderColor: selectedGroups.size === FILTER_GROUPS.length
                    ? colors.primary : colors.outlineVariant,
                  backgroundColor: selectedGroups.size === FILTER_GROUPS.length
                    ? colors.primary : 'transparent',
                },
              ]}>
                {selectedGroups.size === FILTER_GROUPS.length && (
                  <Ionicons name="checkmark" size={12} color={colors.onPrimary} />
                )}
              </View>
              <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>Alle</Text>
            </TouchableOpacity>
            <View style={[styles.filterDivider, { backgroundColor: colors.outlineVariant }]} />
            {/* Gruppe-Zeilen */}
            <ScrollView style={styles.filterScroll} showsVerticalScrollIndicator={false}>
              {FILTER_GROUPS.map(({ group, label, subtitle, kinds }) => {
                const cs = getEntityCardStyle(colors, kinds[0]!, isDark);
                const checked = selectedGroups.has(group);
                return (
                  <TouchableOpacity key={group} onPress={() => toggleGroup(group)} style={styles.filterRow}>
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
                    <View>
                      <Text style={[textStyles.labelSection, { color: checked ? cs.accentColor : colors.onSurfaceVariant }]}>
                        {label}
                      </Text>
                      {subtitle ? (
                        <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, opacity: 0.6 }]}>
                          {subtitle}
                        </Text>
                      ) : null}
                    </View>
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
          {debouncedQuery ? (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              Keine Treffer gefunden.
            </Text>
          ) : (
            <ScopeSearchHint
              {...scopeEmptyParts}
              baseColor={colors.onSurfaceVariant}
              style={typography.bodyMedium}
              textAlign="center"
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, i) =>
            item.type === 'talk' ? item.talk.id : `chunk-${item.result.chunk_id}-${i}`
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
    alignItems: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    margin: spacing.m,
    gap: spacing.s,
  },
  searchBarIcon: {
    marginTop: (SEARCH_INPUT_MIN_HEIGHT - SEARCH_BAR_ICON_SIZE) / 2,
  },
  searchBarTrailingIcon: {
    marginTop: (SEARCH_INPUT_MIN_HEIGHT - 16) / 2,
  },
  searchInputWrap: {
    flex: 1,
  },
  searchInput: {
    width: '100%',
    paddingVertical: 0,
    paddingHorizontal: 0,
    includeFontPadding: false,
  },
  searchMeasureText: {
    position: 'absolute',
    opacity: 0,
    left: 0,
    top: 0,
    zIndex: -1,
  },
  placeholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
  },
  listContent: { paddingHorizontal: spacing.m, paddingBottom: spacing.xl },
  separator: { height: spacing.m },
  // Filter
  filterButton: {
    position: 'relative',
    marginTop: (SEARCH_INPUT_MIN_HEIGHT - SEARCH_BAR_ICON_SIZE) / 2,
  },
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
  filterBadgeText: { fontSize: scaleSize(10), fontWeight: '700', lineHeight: scaleSize(14) },
  filterBackdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 99,
  },
  filterDropdown: {
    position: 'absolute',
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
});
