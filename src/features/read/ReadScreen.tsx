import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
  StyleSheet, useColorScheme, ActivityIndicator, useWindowDimensions,
  type ViewToken, AppState,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { overlayStyles } from '@/shared/styles/overlays';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography, textStyles } from '@/shared/theme';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { BookmarkRepository } from '@/data/repositories/BookmarkRepository';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { TalkRepository } from '@/data/repositories/TalkRepository';

import { useReading } from '@/shared/contexts/ReadingContext';
import ParagraphRenderer from '@/shared/components/ParagraphRenderer';
import ContributionCountButton from '@/shared/components/ContributionCountButton';
import type { ContributionsTab } from '@/shared/contexts/ReadingContext';
import type Paragraph from '@/data/db/models/Paragraph';
import { paragraphAnchorLabel } from '@/shared/lib/paragraphAnchorLabel';

const SOURCE_ID = 'philosophie-der-freiheit';
const LOCAL_USER = 'local';

type Segment = { segmentIndex: number; segmentTitle: string; segmentType: string };

export default function ReadScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { height: windowHeight } = useWindowDimensions();
  const { target, openContributions, navigateToRead, navigateToChat } = useReading();
  /** Begrenzt mehrzeiligen TextInput, damit Inhalt intern scrollt statt die Sheet-Höhe zu sprengen. */
  const noteInputMaxHeight = Math.round(windowHeight * 0.45);

  const [allParagraphs, setAllParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteCounts, setNoteCounts] = useState<Map<string, number>>(new Map());
  const [talkCounts, setTalkCounts] = useState<Map<string, number>>(new Map());

  const [menuParagraph, setMenuParagraph] = useState<Paragraph | null>(null);
  const [menuMode, setMenuMode] = useState<'menu' | 'editor'>('menu');
  const [noteContent, setNoteContent] = useState('');
  const allParagraphsRef = useRef<Paragraph[]>([]);
  allParagraphsRef.current = allParagraphs;
  const listRef = useRef<FlashList<Paragraph>>(null);
  const lastReadWriteParagraphId = useRef<string | null>(null);
  const pendingLastReadParagraphId = useRef<string | null>(null);
  const lastReadDebounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Verhindert, dass beim ersten Mount (Reload, target leer) sofort Kapitel 0 als Lesestelle in die DB geschrieben wird. */
  const lastReadSegmentBaselineRef = useRef<number | null>(null);
  /**
   * Nach Reload zeigt die Liste zuerst Kapitel 0 — Viewability würde sonst z. B. :0:2 als Lesestelle schreiben.
   * Erst nach DB-Hydration (findLastRead → navigateToRead) oder sobald das Target explizit gesetzt ist, wieder erlauben.
   */
  const lastReadCaptureEnabledRef = useRef(false);
  const blankTargetHydrateDoneRef = useRef(false);

  useEffect(() => {
    const sub = ParagraphRepository.observeBySource(SOURCE_ID).subscribe((ps) => {
      setAllParagraphs(ps);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = NoteRepository.observeBySource(SOURCE_ID).subscribe((notes) => {
      const counts = new Map<string, number>();
      for (const n of notes) {
        if (n.paragraphId) counts.set(n.paragraphId, (counts.get(n.paragraphId) ?? 0) + 1);
      }
      setNoteCounts(counts);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = TalkRepository.observeByUser(LOCAL_USER).subscribe((talks) => {
      const counts = new Map<string, number>();
      for (const t of talks) {
        const pid = t.contextParagraphId;
        if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1);
      }
      setTalkCounts(counts);
    });
    return () => sub.unsubscribe();
  }, []);


  const segments = useMemo<Segment[]>(() => {
    const seen = new Map<number, Segment>();
    for (const p of allParagraphs) {
      if (!seen.has(p.segmentIndex)) {
        seen.set(p.segmentIndex, {
          segmentIndex: p.segmentIndex,
          segmentTitle: p.segmentTitle,
          segmentType: p.segmentType,
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.segmentIndex - b.segmentIndex);
  }, [allParagraphs]);

  const currentSegmentIndex = useMemo(() => {
    if (target.segmentIndex !== null) return target.segmentIndex;
    if (target.paragraphId) {
      const hit = allParagraphs.find((p) => p.paragraphId === target.paragraphId);
      if (hit) return hit.segmentIndex;
    }
    return segments[0]?.segmentIndex ?? 0;
  }, [target.segmentIndex, target.paragraphId, allParagraphs, segments]);

  const chapterParagraphs = useMemo(
    () => allParagraphs.filter((p) => p.segmentIndex === currentSegmentIndex),
    [allParagraphs, currentSegmentIndex],
  );

  const currentSegment = useMemo(
    () => segments.find((s) => s.segmentIndex === currentSegmentIndex),
    [segments, currentSegmentIndex],
  );

  const currentSegmentPos = segments.findIndex((s) => s.segmentIndex === currentSegmentIndex);
  const prevSegment = currentSegmentPos > 0 ? segments[currentSegmentPos - 1] : null;
  const nextSegment = currentSegmentPos < segments.length - 1 ? segments[currentSegmentPos + 1] : null;

  const flushPendingLastRead = useCallback(() => {
    if (!lastReadCaptureEnabledRef.current) return;
    const pid = pendingLastReadParagraphId.current;
    if (!pid || pid === lastReadWriteParagraphId.current) return;
    lastReadWriteParagraphId.current = pid;
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      // eslint-disable-next-line no-console
      console.log('[ReadScreen → BookmarkRepository.setLastRead]', { sourceId: SOURCE_ID, paragraphId: pid });
    }
    void BookmarkRepository.setLastRead(LOCAL_USER, SOURCE_ID, pid);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!lastReadCaptureEnabledRef.current) return;
      const visible = viewableItems
        .filter((v) => v.isViewable && v.item != null && typeof v.index === 'number')
        .sort((a, b) => (a.index as number) - (b.index as number));
      /** Unterster sichtbarer Absatz = Lesefortschritt (oberste Zeilen bleiben oft noch „viewable“). */
      const item = visible[visible.length - 1]?.item as Paragraph | undefined;
      const pid = item?.paragraphId;
      if (!pid) return;
      pendingLastReadParagraphId.current = pid;
      if (lastReadDebounceTimer.current) clearTimeout(lastReadDebounceTimer.current);
      lastReadDebounceTimer.current = setTimeout(flushPendingLastRead, 280);
    },
    [flushPendingLastRead],
  );

  const flushScrollIdle = useCallback(() => {
    if (lastReadDebounceTimer.current) {
      clearTimeout(lastReadDebounceTimer.current);
      lastReadDebounceTimer.current = null;
    }
    flushPendingLastRead();
  }, [flushPendingLastRead]);

  const firstChapterParagraphId = chapterParagraphs[0]?.paragraphId;

  /**
   * Kapitelwechsel ohne Zielabsatz: Lesemarke sofort auf Kapitelanfang (stale Debounce vom vorherigen Kapitel).
   * Nicht beim ersten „Einfrieren“ von segmentIndex nach Mount — sonst überschreibt ein Reload mit leerem target die DB mit Kapitel 0.
   */
  useEffect(() => {
    if (!firstChapterParagraphId) return;
    if (target.paragraphId) {
      lastReadSegmentBaselineRef.current = currentSegmentIndex;
      return;
    }
    const prevSeg = lastReadSegmentBaselineRef.current;
    lastReadSegmentBaselineRef.current = currentSegmentIndex;
    if (prevSeg === null) return;
    if (prevSeg === currentSegmentIndex) return;
    if (!lastReadCaptureEnabledRef.current) return;
    if (lastReadDebounceTimer.current) {
      clearTimeout(lastReadDebounceTimer.current);
      lastReadDebounceTimer.current = null;
    }
    pendingLastReadParagraphId.current = firstChapterParagraphId;
    lastReadWriteParagraphId.current = null;
    flushPendingLastRead();
  }, [currentSegmentIndex, firstChapterParagraphId, target.paragraphId, flushPendingLastRead]);

  /** Erster Wechsel von leerem Target → Navigation: Capture kurz sperren, bis Ziel-Kapitel gerendert ist (sonst Viewability auf Kapitel 0). */
  const hadNavigatedExplicitTargetRef = useRef(false);

  useEffect(() => {
    const blank = target.segmentIndex === null && target.paragraphId === null;
    if (blank) {
      hadNavigatedExplicitTargetRef.current = false;
      lastReadCaptureEnabledRef.current = false;
      return;
    }
    if (!hadNavigatedExplicitTargetRef.current) {
      hadNavigatedExplicitTargetRef.current = true;
      lastReadCaptureEnabledRef.current = false;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          lastReadCaptureEnabledRef.current = true;
        });
      });
      return;
    }
    lastReadCaptureEnabledRef.current = true;
  }, [target.segmentIndex, target.paragraphId]);

  /**
   * Reload: Context target ist leer, die FlatList zeigt trotzdem Kapitel 0 — ohne Hydration würde Viewability die DB überschreiben.
   */
  useEffect(() => {
    if (target.segmentIndex !== null || target.paragraphId !== null) {
      blankTargetHydrateDoneRef.current = false;
      return;
    }
    if (allParagraphs.length === 0) return;
    if (blankTargetHydrateDoneRef.current) return;
    blankTargetHydrateDoneRef.current = true;

    let cancelled = false;
    void (async () => {
      const row = await BookmarkRepository.findLastRead(SOURCE_ID);
      if (cancelled) return;
      if (row?.paragraphId) {
        const hit = allParagraphsRef.current.find((p) => p.paragraphId === row.paragraphId);
        if (hit) {
          navigateToRead({ segmentIndex: null, paragraphId: row.paragraphId });
          return;
        }
      }
      if (!cancelled) {
        lastReadCaptureEnabledRef.current = true;
      }
    })();

    return () => {
      cancelled = true;
      blankTargetHydrateDoneRef.current = false;
    };
  }, [target.segmentIndex, target.paragraphId, allParagraphs.length, navigateToRead]);

  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 55 }),
    [],
  );

  useEffect(() => {
    const flushOnBackground = (state: string) => {
      if (state !== 'active') {
        if (lastReadDebounceTimer.current) {
          clearTimeout(lastReadDebounceTimer.current);
          lastReadDebounceTimer.current = null;
        }
        flushPendingLastRead();
      }
    };
    const sub = AppState.addEventListener('change', flushOnBackground);
    return () => {
      sub.remove();
      if (lastReadDebounceTimer.current) {
        clearTimeout(lastReadDebounceTimer.current);
        lastReadDebounceTimer.current = null;
      }
      flushPendingLastRead();
    };
  }, [flushPendingLastRead]);

  useEffect(() => {
    if (!target.paragraphId || chapterParagraphs.length === 0) return;
    const idx = chapterParagraphs.findIndex((p) => p.paragraphId === target.paragraphId);
    if (idx >= 0) {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewOffset: 8 });
    }
  }, [target.paragraphId, chapterParagraphs]);

  const handleLongPress = useCallback((p: Paragraph) => setMenuParagraph(p), []);

  const handleOpenNoteEditor = useCallback(() => {
    setNoteContent('');
    setMenuMode('editor');
  }, []);

  const handleSaveNote = useCallback(async () => {
    const trimmed = noteContent.trim();
    const paragraph = menuParagraph;
    if (trimmed && paragraph) {
      await NoteRepository.create({
        userId: LOCAL_USER,
        paragraphId: paragraph.paragraphId,
        segmentId: `${SOURCE_ID}:${paragraph.segmentIndex}`,
        sourceId: SOURCE_ID,
        content: trimmed,
      });
    }
    setMenuParagraph(null);
    setMenuMode('menu');
    setNoteContent('');

    if (trimmed && paragraph) {
      openContributions(paragraph, 'notes', SOURCE_ID);
    }
  }, [noteContent, menuParagraph, openContributions]);

  const handleCloseMenu = useCallback(() => {
    setMenuParagraph(null);
    setMenuMode('menu');
  }, []);

  const handleStartChatFromMenu = useCallback(() => {
    if (!menuParagraph) return;
    setMenuParagraph(null);
    setMenuMode('menu');
    navigateToChat();
  }, [menuParagraph, navigateToChat]);

  const handleShowContributionsFromMenu = useCallback(() => {
    if (!menuParagraph) return;
    const p = menuParagraph;
    setMenuParagraph(null);
    setMenuMode('menu');
    openContributions(p, 'notes', SOURCE_ID);
  }, [menuParagraph, openContributions]);

  const showContributions = useCallback((p: Paragraph, tab: ContributionsTab) => {
    openContributions(p, tab, SOURCE_ID);
  }, [openContributions]);

  const renderItem = useCallback(({ item }: { item: Paragraph }) => {
    const noteCount = noteCounts.get(item.paragraphId) ?? 0;
    const conversationCount = talkCounts.get(item.paragraphId) ?? 0;
    const hasContributions = noteCount > 0 || conversationCount > 0;
    const openTab = (tab: ContributionsTab) => showContributions(item, tab);
    return (
      <TouchableOpacity
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
        activeOpacity={0.9}
        style={styles.paragraphWrap}
      >
        <ParagraphRenderer
          text={item.textRaw}
          annotations={item.annotations}
          style={{ color: colors.onBackground }}
          prefix={
            <Text style={[textStyles.readingParagraphNumber, { color: colors.onSurfaceVariant }]}>
              {item.paragraphNumber}{'| '}
            </Text>
          }
        />
        {hasContributions && (
          <View style={styles.contributionStrip}>
            <ContributionCountButton kind="notes" count={noteCount} onPress={() => openTab('notes')} />
            <ContributionCountButton kind="conversations" count={conversationCount} onPress={() => openTab('conversations')} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [noteCounts, talkCounts, colors, handleLongPress, showContributions]);

  const typeLabel = currentSegment?.segmentType === 'preface' ? 'Vorwort' : 'Kapitel';

  const listHeader = useMemo(() => {
    if (!currentSegment) return null;
    return (
      <View style={styles.chapterBlock}>
        <Text style={[textStyles.labelSection, { color: colors.primary }]}>{typeLabel}</Text>
        <Text
          style={[textStyles.readingChapterTitle, { color: colors.onBackground }]}
          accessibilityRole="header"
        >
          {currentSegment.segmentTitle}
        </Text>
      </View>
    );
  }, [currentSegment, typeLabel, colors.primary, colors.onBackground]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <FlashList
        ref={listRef}
        data={chapterParagraphs}
        keyExtractor={(p) => p.paragraphId}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={150}
        onScrollToIndexFailed={() => {}}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onMomentumScrollEnd={flushScrollIdle}
        onScrollEndDrag={flushScrollIdle}
      />

      {/* Kapitel-Navigation */}
      <View style={[styles.chapNav, { borderTopColor: colors.outlineVariant, backgroundColor: colors.surfaceContainer }]}>
        <TouchableOpacity
          style={[styles.chapNavBtn, !prevSegment && styles.chapNavBtnDisabled]}
          onPress={() => prevSegment && navigateToRead({ segmentIndex: prevSegment.segmentIndex, paragraphId: null })}
          disabled={!prevSegment}
        >
          <Ionicons name="chevron-back" size={16} color={prevSegment ? colors.primary : colors.onSurfaceVariant} />
          <Text
            style={[typography.labelMedium, styles.chapNavText, { color: prevSegment ? colors.primary : colors.onSurfaceVariant }]}
            numberOfLines={1}
          >
            {prevSegment?.segmentTitle ?? ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.chapNavBtn, styles.chapNavBtnRight, !nextSegment && styles.chapNavBtnDisabled]}
          onPress={() => nextSegment && navigateToRead({ segmentIndex: nextSegment.segmentIndex, paragraphId: null })}
          disabled={!nextSegment}
        >
          <Text
            style={[typography.labelMedium, styles.chapNavText, { color: nextSegment ? colors.primary : colors.onSurfaceVariant, textAlign: 'right' }]}
            numberOfLines={1}
          >
            {nextSegment?.segmentTitle ?? ''}
          </Text>
          <Ionicons name="chevron-forward" size={16} color={nextSegment ? colors.primary : colors.onSurfaceVariant} />
        </TouchableOpacity>
      </View>

      {menuParagraph !== null && (
        <View style={overlayStyles.sheetLayer} pointerEvents="box-none">
          {menuMode === 'menu' ? (
            <Pressable style={styles.overlay} onPress={handleCloseMenu}>
              <View style={[styles.menu, { backgroundColor: colors.surfaceContainer }]}>
                <Text
                  style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}
                  numberOfLines={3}
                >
                  {paragraphAnchorLabel(menuParagraph)}
                </Text>
                <TouchableOpacity style={styles.menuRow} onPress={handleOpenNoteEditor}>
                  <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                    Notiz erstellen
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={handleStartChatFromMenu}>
                  <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                    KI-Chat starten
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuRow} onPress={handleShowContributionsFromMenu}>
                  <Ionicons name="albums-outline" size={20} color={colors.primary} />
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                    Beiträge anzeigen
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          ) : (
            <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
              <Pressable style={styles.overlay} onPress={handleCloseMenu} />
              <View style={[styles.menu, { backgroundColor: colors.surfaceContainer, gap: spacing.s }]}>
                <Text
                  style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, marginBottom: spacing.xs, textTransform: 'none' }]}
                  numberOfLines={3}
                >
                  {paragraphAnchorLabel(menuParagraph)}
                </Text>
                <TextInput
                  style={[
                    textStyles.noteBody,
                    styles.noteInput,
                    {
                      color: colors.onSurface,
                      borderColor: colors.outlineVariant,
                      backgroundColor: colors.surfaceContainerLow,
                      maxHeight: noteInputMaxHeight,
                    },
                  ]}
                  multiline
                  scrollEnabled
                  textAlignVertical="top"
                  autoFocus
                  placeholder="Notiz eingeben..."
                  placeholderTextColor={colors.onSurfaceVariant}
                  value={noteContent}
                  onChangeText={setNoteContent}
                />
                <View style={styles.noteActions}>
                  <TouchableOpacity style={styles.noteBtn} onPress={handleCloseMenu}>
                    <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant }]}>Abbrechen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.noteBtn, styles.noteBtnFilled, { backgroundColor: colors.primary }]} onPress={handleSaveNote}>
                    <Text style={[textStyles.contributionsTab, { color: colors.onPrimary }]}>Speichern</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 22, paddingVertical: spacing.l, gap: 26 },
  chapterBlock: {
    gap: spacing.s,
    marginBottom: spacing.s,
    alignItems: 'center',
  },
  paragraphWrap: { gap: 4 },
  contributionStrip: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 2,
  },
  chapNav: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  chapNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
  },
  chapNavBtnRight: { justifyContent: 'flex-end' },
  chapNavBtnDisabled: { opacity: 0.3 },
  chapNavText: { flex: 1, flexShrink: 1 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  menu: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.m,
    paddingBottom: spacing.xl,
    gap: 4,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.m,
    paddingVertical: spacing.s,
  },
  flex: { flex: 1, justifyContent: 'flex-end' },
  noteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: spacing.s,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.s },
  noteBtn: { paddingVertical: spacing.s, paddingHorizontal: spacing.m, borderRadius: 20 },
  noteBtnFilled: {},
});
