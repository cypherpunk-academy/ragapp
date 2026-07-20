import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, Pressable,
  StyleSheet, useColorScheme, ActivityIndicator,
  type ViewToken, AppState,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import AppBar from '@/shared/components/AppBar';
import { overlayStyles } from '@/shared/styles/overlays';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography, textStyles, contributionIcon, ICONS, ICON_SIZES } from '@/shared/theme';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { BookmarkRepository } from '@/data/repositories/BookmarkRepository';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { SourceRepository } from '@/data/repositories/SourceRepository';
import AppIcon from '@/shared/components/AppIcon';
import DocumentPreviewOverlay from '@/shared/components/DocumentPreviewOverlay';
import NoteEditorModal from '@/shared/components/NoteEditorModal';

import { useReading } from '@/shared/contexts/ReadingContext';
import ParagraphRenderer from '@/shared/components/ParagraphRenderer';
import type Paragraph from '@/data/db/models/Paragraph';
import type Note from '@/data/db/models/Note';
import { paragraphAnchorLabel } from '@/shared/lib/paragraphAnchorLabel';
import { stripSegmentTitleHtml } from '@/shared/lib/segmentTitleDisplay';
import { resolveSegmentSlug } from '@/shared/lib/segmentSlug';
import SegmentTitleText from '@/shared/components/SegmentTitleText';
import { useWarnings } from '@/shared/contexts/WarningsContext';

const LOCAL_USER = 'local';

type Segment = { segmentIndex: number; segmentTitle: string; segmentSlug: string | null };

export default function ReadScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const {
    target, openContributions, navigateToRead, navigateToChatWithParagraph, navigateBack,
    navigationHistory, navigateToSearch, navigateToChat, searchReturnActive, searchReturnOrigin,
    navigateToChatWithPendingLink,
  } = useReading();
  const sourceId = target.sourceId;
  const hasHistory = navigationHistory.length > 0;
  /** Immer aktuelle sourceId für Callbacks mit leerem deps-Array (verhindert stale closure). */
  const sourceIdRef = useRef(sourceId);
  sourceIdRef.current = sourceId;

  const [allParagraphs, setAllParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteCounts, setNoteCounts] = useState<Map<string, number>>(new Map());
  const [talkCounts, setTalkCounts] = useState<Map<string, number>>(new Map());
  const [bookmarkIds, setBookmarkIds] = useState<Set<string>>(new Set());
  const { setWarning } = useWarnings();

  const [menuParagraph, setMenuParagraph] = useState<Paragraph | null>(null);
  const [menuParagraphNote, setMenuParagraphNote] = useState<Note | null>(null);
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [creatingNoteFor, setCreatingNoteFor] = useState<{ paragraphId?: string; segmentSlug?: string; sourceId?: string; initialContent?: string } | null>(null);
  const [chapterNote, setChapterNote] = useState<Note | null>(null);
  const [sourceMeta, setSourceMeta] = useState<{ author: string; title: string } | null>(null);
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
  /** Letzter segmentIndex für den bereits zum Anfang gescrollt wurde — verhindert doppeltes Scrollen. */
  const lastScrolledSegmentRef = useRef<number | null>(null);
  /** Temporärer roter Punkt-Marker an der Zitat-Position (nur aus Zitat-Suche, siehe target.markerOffset). */
  const [marker, setMarker] = useState<{ paragraphId: string; offset: number } | null>(null);
  const markerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!sourceId) return;
    setLoading(true);
    setAllParagraphs([]);
    const sub = ParagraphRepository.observeBySource(sourceId).subscribe((ps) => {
      setAllParagraphs(ps);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, [sourceId]);

  useEffect(() => {
    if (!sourceId) {
      setSourceMeta(null);
      return;
    }
    let cancelled = false;
    void SourceRepository.findById(sourceId).then((source) => {
      if (cancelled) return;
      if (!source) {
        setSourceMeta(null);
        return;
      }
      setSourceMeta({ author: source.author, title: source.title });
    });
    return () => { cancelled = true; };
  }, [sourceId]);

  useEffect(() => {
    const sub = NoteRepository.observeBySource(sourceId).subscribe((notes) => {
      const counts = new Map<string, number>();
      for (const n of notes) {
        if (n.paragraphId) counts.set(n.paragraphId, (counts.get(n.paragraphId) ?? 0) + 1);
      }
      setNoteCounts(counts);
    });
    return () => sub.unsubscribe();
  }, [sourceId]);

  useEffect(() => {
    const sub = TalkRepository.observeByUser(LOCAL_USER).subscribe((talks) => {
      const counts = new Map<string, number>();
      for (const t of talks) {
        const pid = t.kontextParagraphId;
        if (pid) counts.set(pid, (counts.get(pid) ?? 0) + 1);
      }
      setTalkCounts(counts);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = BookmarkRepository.observeManualBookmarks(sourceId).subscribe((bms) => {
      setBookmarkIds(new Set(bms.map((b) => b.paragraphId)));
    });
    return () => sub.unsubscribe();
  }, [sourceId]);


  useEffect(() => {
    if (!target.paragraphId || loading) {
      setWarning('read-nav-error', null);
      return;
    }
    if (allParagraphs.length === 0) return;
    const hit = allParagraphs.find((p) => p.id === target.paragraphId);
    setWarning(
      'read-nav-error',
      hit ? null : 'Der angeforderte Absatz ist nicht mehr verfügbar — möglicherweise nach einer Textüberarbeitung.',
    );
  }, [target.paragraphId, allParagraphs, loading, setWarning]);

  useEffect(() => {
    return () => { setWarning('read-nav-error', null); };
  }, [setWarning]);

  const segments = useMemo<Segment[]>(() => {
    const seen = new Map<number, Segment>();
    for (const p of allParagraphs) {
      if (!seen.has(p.segmentIndex)) {
        seen.set(p.segmentIndex, {
          segmentIndex: p.segmentIndex,
          segmentTitle: p.segmentTitle,
          // Seed snapshot may lack segment_slug; derive so chapter notes still work.
          segmentSlug: resolveSegmentSlug(p.segmentSlug, p.segmentTitle, p.segmentIndex),
        });
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.segmentIndex - b.segmentIndex);
  }, [allParagraphs]);

  const currentSegmentIndex = useMemo(() => {
    if (target.segmentIndex !== null) return target.segmentIndex;
    if (target.paragraphId) {
      const hit = allParagraphs.find((p) => p.id === target.paragraphId);
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

  const currentSegmentSlug = currentSegment?.segmentSlug ?? null;

  useEffect(() => {
    if (!currentSegmentSlug) { setChapterNote(null); return; }
    let cancelled = false;
    void NoteRepository.findBySegment(sourceId, currentSegmentSlug).then((notes) => {
      if (!cancelled) setChapterNote(notes[0] ?? null);
    });
    return () => { cancelled = true; };
  }, [sourceId, currentSegmentSlug]);

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
      console.log('[ReadScreen → BookmarkRepository.setLastRead]', { sourceId: sourceId, paragraphId: pid });
    }
    void BookmarkRepository.setLastRead(LOCAL_USER, sourceIdRef.current, pid);
  }, []);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (!lastReadCaptureEnabledRef.current) return;
      const visible = viewableItems
        .filter((v) => v.isViewable && v.item != null && typeof v.index === 'number')
        .sort((a, b) => (a.index as number) - (b.index as number));
      /** Unterster sichtbarer Absatz = Lesefortschritt (oberste Zeilen bleiben oft noch „viewable“). */
      const item = visible[visible.length - 1]?.item as Paragraph | undefined;
      const pid = item?.id;
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

  const firstChapterParagraphId = chapterParagraphs[0]?.id;

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
    if (prevSeg === currentSegmentIndex) return;
    if (lastReadDebounceTimer.current) {
      clearTimeout(lastReadDebounceTimer.current);
      lastReadDebounceTimer.current = null;
    }
    pendingLastReadParagraphId.current = firstChapterParagraphId;
    lastReadWriteParagraphId.current = null;
    if (target.segmentIndex !== null) {
      // Expliziter Kapitelwechsel (aus Übersicht oder Kapitel-Nav): sofort in DB schreiben
      void BookmarkRepository.setLastRead(LOCAL_USER, sourceId, firstChapterParagraphId);
    } else {
      // Impliziter Wechsel: nur wenn Capture aktiv und vorher schon ein Kapitel bekannt
      if (prevSeg === null) return;
      if (!lastReadCaptureEnabledRef.current) return;
      flushPendingLastRead();
    }
  }, [currentSegmentIndex, firstChapterParagraphId, target.paragraphId, target.segmentIndex, flushPendingLastRead, sourceId]);

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
   * Tab-Wechsel bleibt aus (Start-Tab ist Philo); WEITERLESEN nutzt dieselbe Lesestelle.
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
      const row = await BookmarkRepository.findLastRead(sourceId);
      if (cancelled) return;
      if (row?.paragraphId) {
        const hit = allParagraphsRef.current.find((p) => p.id === row.paragraphId);
        if (hit) {
          navigateToRead({ segmentIndex: null, paragraphId: row.paragraphId, switchTab: false });
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
    if (chapterParagraphs.length === 0) return;
    if (target.paragraphId) {
      // Lesezeichen oder letzter Lesestand: zum Absatz scrollen
      const idx = chapterParagraphs.findIndex((p) => p.id === target.paragraphId);
      if (idx >= 0) {
        // Bei Zitat-Sprung (markerOffset gesetzt) in der zweiten Absatzhälfte: Absatzende statt
        // Absatzanfang an den Viewport binden, damit lange Absätze den Marker sofort sichtbar zeigen.
        const textLen = chapterParagraphs[idx]?.textRaw?.length ?? 0;
        const nearEnd = target.markerOffset != null && textLen > 0 && target.markerOffset / textLen > 0.5;
        listRef.current?.scrollToIndex({
          index: idx,
          animated: true,
          viewPosition: nearEnd ? 1 : 0,
          viewOffset: nearEnd ? -8 : 8,
        });
      }
      lastScrolledSegmentRef.current = null;
    } else if (target.segmentIndex !== null && target.segmentIndex !== lastScrolledSegmentRef.current) {
      // Expliziter Kapitelwechsel ohne Absatz-Ziel: zum Kapitelanfang scrollen
      lastScrolledSegmentRef.current = target.segmentIndex;
      listRef.current?.scrollToIndex({ index: 0, animated: false });
    }
  }, [target.paragraphId, target.segmentIndex, target.markerOffset, chapterParagraphs]);

  useEffect(() => {
    if (markerTimerRef.current) {
      clearTimeout(markerTimerRef.current);
      markerTimerRef.current = null;
    }
    if (target.markerOffset == null || !target.paragraphId) {
      setMarker(null);
      return;
    }
    setMarker({ paragraphId: target.paragraphId, offset: target.markerOffset });
    markerTimerRef.current = setTimeout(() => setMarker(null), 10000);
    return () => {
      if (markerTimerRef.current) {
        clearTimeout(markerTimerRef.current);
        markerTimerRef.current = null;
      }
    };
  }, [target.paragraphId, target.markerOffset, target.navSeq]);

  const handleLongPress = useCallback((p: Paragraph) => setMenuParagraph(p), []);

  useEffect(() => {
    if (!menuParagraph) { setMenuParagraphNote(null); return; }
    let cancelled = false;
    void NoteRepository.findByParagraph(menuParagraph.id).then((notes) => {
      if (!cancelled) setMenuParagraphNote(notes[0] ?? null);
    });
    return () => { cancelled = true; };
  }, [menuParagraph]);

  const handleCloseMenu = useCallback(() => {
    setMenuParagraph(null);
  }, []);

  const handleParagraphNotePress = useCallback(() => {
    if (!menuParagraph) return;
    if (menuParagraphNote) {
      setPreviewNote(menuParagraphNote);
    } else {
      const chapterTitle = currentSegment ? stripSegmentTitleHtml(currentSegment.segmentTitle) : '';
      setCreatingNoteFor({
        paragraphId: menuParagraph.id,
        segmentSlug: menuParagraph.segmentSlug ?? undefined,
        sourceId,
        initialContent: `# Arbeitstext über Absatz ${menuParagraph.paragraphNumber}${chapterTitle ? ` im Kapitel ${chapterTitle}` : ''}\n\n`,
      });
    }
    setMenuParagraph(null);
  }, [menuParagraph, menuParagraphNote, sourceId, currentSegment]);

  const handleStartChatFromMenu = useCallback(() => {
    if (!menuParagraph) return;
    const paragraphId = menuParagraph.id;
    setMenuParagraph(null);
    navigateToChatWithParagraph(paragraphId);
  }, [menuParagraph, navigateToChatWithParagraph]);

  const handleShowContributionsFromMenu = useCallback(() => {
    if (!menuParagraph) return;
    const p = menuParagraph;
    setMenuParagraph(null);
    openContributions(p, sourceId);
  }, [menuParagraph, openContributions, sourceId]);

  const handleToggleBookmarkFromMenu = useCallback(() => {
    if (!menuParagraph) return;
    void BookmarkRepository.toggleManualBookmark(LOCAL_USER, sourceId, menuParagraph.id);
    setMenuParagraph(null);
  }, [menuParagraph]);

  const handleChapterNotePress = useCallback(() => {
    if (!currentSegment) return;
    if (chapterNote) {
      setPreviewNote(chapterNote);
    } else if (currentSegment.segmentSlug) {
      setCreatingNoteFor({
        segmentSlug: currentSegment.segmentSlug,
        sourceId,
        initialContent: `# Arbeitstext über das Kapitel ${stripSegmentTitleHtml(currentSegment.segmentTitle)}\n\n`,
      });
    }
  }, [currentSegment, chapterNote, sourceId]);

  const showContributions = useCallback((p: Paragraph) => {
    openContributions(p, sourceId);
  }, [openContributions, sourceId]);

  const handleShowParagraphNote = useCallback((p: Paragraph) => {
    void NoteRepository.findByParagraph(p.id).then((notes) => {
      if (notes[0]) setPreviewNote(notes[0]);
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: Paragraph }) => {
    const noteCount = noteCounts.get(item.id) ?? 0;
    const conversationCount = talkCounts.get(item.id) ?? 0;
    const isBookmarked = bookmarkIds.has(item.id);
    const hasStrip = noteCount > 0 || conversationCount > 0;
    const iconMeta = colors.onSurfaceVariant;
    const iconPx = ICON_SIZES.strip;

    return (
      <Pressable
        onLongPress={() => handleLongPress(item)}
        delayLongPress={400}
        style={styles.paragraphWrap}
      >
        <ParagraphRenderer
          text={item.textRaw}
          annotations={item.annotations}
          paragraphId={item.id}
          markerOffset={item.id === marker?.paragraphId ? marker.offset : null}
          style={{ color: colors.onBackground }}
          prefix={
            <>
              <Text style={[textStyles.readingParagraphNumber, { color: colors.onSurfaceVariant }]}>
                {item.paragraphNumber}{'| '}
              </Text>
              {isBookmarked ? (
                <Text
                  onPress={() =>
                    void BookmarkRepository.toggleManualBookmark(LOCAL_USER, sourceId, item.id)
                  }
                  style={styles.inlineContributionHit}
                >
                  <MaterialIcons name="bookmark" size={iconPx} color={colors.primary} />
                  {'\u2002'}
                </Text>
              ) : null}
            </>
          }
          suffix={
            hasStrip ? (
              <Text style={[styles.inlineContributions, { color: iconMeta }]}>
                {noteCount > 0 ? (
                  <Text onPress={() => handleShowParagraphNote(item)} style={styles.inlineContributionHit}>
                    <MaterialIcons name={contributionIcon('notes')} size={iconPx} color={iconMeta} />
                    <Text style={styles.inlineContributionCount}>{noteCount}</Text>
                  </Text>
                ) : null}
                {conversationCount > 0 ? (
                  <Text onPress={() => showContributions(item)} style={styles.inlineContributionHit}>
                    {noteCount > 0 ? '\u2002' : null}
                    <MaterialIcons name={contributionIcon('conversations')} size={iconPx} color={iconMeta} />
                    <Text style={styles.inlineContributionCount}>{conversationCount}</Text>
                  </Text>
                ) : null}
              </Text>
            ) : undefined
          }
        />
      </Pressable>
    );
  }, [noteCounts, talkCounts, bookmarkIds, colors, handleLongPress, showContributions, handleShowParagraphNote, marker]);

  const typeLabel = 'Kapitel';

  const listHeader = useMemo(() => {
    if (!currentSegment) return null;
    return (
      <View style={styles.chapterBlock}>
        <View style={styles.chapterTitleRow}>
          <Text style={[textStyles.labelSection, { color: colors.primary }]}>{typeLabel}</Text>
          <TouchableOpacity onPress={handleChapterNotePress} hitSlop={8}>
            <AppIcon
              name={ICONS.arbeitstext.attach}
              size={ICON_SIZES.menu}
              color={chapterNote ? colors.primary : colors.onSurfaceVariant}
            />
          </TouchableOpacity>
        </View>
        <SegmentTitleText
          title={currentSegment.segmentTitle}
          style={[textStyles.readingChapterTitle, { color: colors.onBackground }]}
          accessibilityRole="header"
        />
      </View>
    );
  }, [currentSegment, typeLabel, colors.primary, colors.onBackground, colors.onSurfaceVariant, chapterNote, handleChapterNotePress]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <AppBar
        title={hasHistory ? 'Zurück' : searchReturnActive ? (searchReturnOrigin === 'chat' ? 'Quellenverweise' : 'Suche') : (currentSegment ? stripSegmentTitleHtml(currentSegment.segmentTitle) : 'Lesen')}
        titleStyle={(hasHistory || searchReturnActive) ? textStyles.labelTab : textStyles.chapterTitle}
        onBackPress={hasHistory ? navigateBack : searchReturnActive ? (searchReturnOrigin === 'chat' ? navigateToChat : navigateToSearch) : undefined}
      />
      <FlashList
        style={styles.list}
        ref={listRef}
        data={chapterParagraphs}
        keyExtractor={(p) => p.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={150}
        onScrollToIndexFailed={(info) => {
          const { index } = info;
          setTimeout(() => {
            listRef.current?.scrollToIndex({ index, animated: false, viewOffset: 8 });
          }, 150);
        }}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onMomentumScrollEnd={flushScrollIdle}
        onScrollEndDrag={flushScrollIdle}
      />

      {/* Kapitel-Navigation: Buchkontext, Kapiteltitel, Prev/Next ausgeschrieben */}
      <View style={[styles.chapNav, { borderTopColor: colors.outlineVariant, backgroundColor: colors.surfaceContainer }]}>
        <View style={styles.chapNavCenter} accessibilityRole="text">
          {(sourceMeta?.author || sourceMeta?.title) ? (
            <Text
              style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, textAlign: 'center', fontWeight: '400' }]}
              numberOfLines={1}
            >
              {[sourceMeta?.author, sourceMeta?.title].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
        </View>

        <View style={styles.chapNavRow}>
          <TouchableOpacity
            style={[styles.chapNavBtn, styles.chapNavBtnLeft, !prevSegment && styles.chapNavBtnDisabled]}
            onPress={() => prevSegment && navigateToRead({ segmentIndex: prevSegment.segmentIndex, paragraphId: null })}
            disabled={!prevSegment}
            hitSlop={8}
            accessibilityLabel="Voriges Kapitel"
          >
            <Ionicons name="chevron-back" size={18} color={prevSegment ? colors.primary : colors.onSurfaceVariant} />
            <SegmentTitleText
              title={prevSegment?.segmentTitle ?? ''}
              style={[typography.labelSmall, styles.chapNavSideText, { color: prevSegment ? colors.primary : colors.onSurfaceVariant }]}
              numberOfLines={1}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chapNavBtn, styles.chapNavBtnRight, !nextSegment && styles.chapNavBtnDisabled]}
            onPress={() => nextSegment && navigateToRead({ segmentIndex: nextSegment.segmentIndex, paragraphId: null })}
            disabled={!nextSegment}
            hitSlop={8}
            accessibilityLabel="Nächstes Kapitel"
          >
            <SegmentTitleText
              title={nextSegment?.segmentTitle ?? ''}
              style={[typography.labelSmall, styles.chapNavSideText, { color: nextSegment ? colors.primary : colors.onSurfaceVariant, textAlign: 'right' }]}
              numberOfLines={1}
            />
            <Ionicons name="chevron-forward" size={18} color={nextSegment ? colors.primary : colors.onSurfaceVariant} />
          </TouchableOpacity>
        </View>
      </View>

      {menuParagraph !== null && (
        <View style={overlayStyles.sheetLayer} pointerEvents="box-none">
          <Pressable style={styles.overlay} onPress={handleCloseMenu}>
            <View style={[styles.menu, { backgroundColor: colors.surfaceContainer }]}>
              <Text
                style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}
                numberOfLines={3}
              >
                {paragraphAnchorLabel(menuParagraph)}
              </Text>
              <TouchableOpacity style={styles.menuRow} onPress={handleToggleBookmarkFromMenu}>
                <Ionicons
                  name={menuParagraph && bookmarkIds.has(menuParagraph.id) ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                  {menuParagraph && bookmarkIds.has(menuParagraph.id)
                    ? 'Lesezeichen entfernen'
                    : 'Lesezeichen setzen'}
                </Text>
              </TouchableOpacity>
              {menuParagraphNote ? (
                <TouchableOpacity style={styles.menuRow} onPress={handleParagraphNotePress}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                    Arbeitstext
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.menuRow} onPress={handleParagraphNotePress}>
                  <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                    Arbeitstext anlegen
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.menuRow} onPress={handleStartChatFromMenu}>
                <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
                <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                  Philo zu diesem Absatz fragen
                </Text>
              </TouchableOpacity>
              {menuParagraph && (talkCounts.get(menuParagraph.id) ?? 0) > 0 && (
                <TouchableOpacity style={styles.menuRow} onPress={handleShowContributionsFromMenu}>
                  <Ionicons name="albums-outline" size={20} color={colors.primary} />
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
                    Vergangene Gespräche
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </Pressable>
        </View>
      )}

      {previewNote && (
        <DocumentPreviewOverlay
          note={previewNote}
          onClose={() => setPreviewNote(null)}
          onEditInChat={() => navigateToChatWithPendingLink(previewNote.id)}
          onDeleted={() => {
            if (chapterNote?.id === previewNote.id) setChapterNote(null);
          }}
        />
      )}
      {creatingNoteFor && (
        <NoteEditorModal
          visible
          onClose={() => setCreatingNoteFor(null)}
          paragraphId={creatingNoteFor.paragraphId}
          segmentSlug={creatingNoteFor.segmentSlug}
          sourceId={creatingNoteFor.sourceId}
          initialContent={creatingNoteFor.initialContent}
          onCreated={(n) => {
            if (!creatingNoteFor.paragraphId) setChapterNote(n);
          }}
          contextLabel="Neuer Arbeitstext"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, overflow: 'hidden' },
  list: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: { paddingHorizontal: 22, paddingVertical: spacing.l },
  chapterBlock: {
    gap: spacing.s,
    marginBottom: spacing.s,
    alignItems: 'center',
  },
  chapterTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  paragraphWrap: {
    marginBottom: spacing.l,
  },
  inlineContributions: {
    fontSize: 11,
    lineHeight: 28,
    includeFontPadding: false,
  },
  inlineContributionHit: {
    paddingHorizontal: 2,
  },
  inlineContributionCount: {
    fontSize: 11,
    lineHeight: 28,
    fontVariant: ['tabular-nums'],
    opacity: 0.85,
  },
  chapNav: {
    borderTopWidth: StyleSheet.hairlineWidth,
    minHeight: 72,
    paddingTop: spacing.s,
    paddingBottom: spacing.s,
    gap: spacing.xs,
  },
  chapNavCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
    gap: 2,
  },
  chapNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chapNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.xs,
  },
  chapNavBtnLeft: { justifyContent: 'flex-start' },
  chapNavBtnRight: { justifyContent: 'flex-end' },
  chapNavBtnDisabled: { opacity: 0.3 },
  chapNavSideText: { flex: 1, flexShrink: 1 },
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
});
