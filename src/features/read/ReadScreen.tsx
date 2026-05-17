import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Modal, Pressable,
  TextInput, KeyboardAvoidingView, Platform,
  StyleSheet, useColorScheme, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '../../theme';
import { ParagraphRepository } from '../../repositories/ParagraphRepository';
import { BookmarkRepository } from '../../repositories/BookmarkRepository';
import { NoteRepository } from '../../repositories/NoteRepository';
import { useReading } from '../../contexts/ReadingContext';
import ParagraphRenderer from '../../components/ParagraphRenderer';
import ContributionCountButton, { type ContributionKind } from '../../components/ContributionCountButton';
import ContributionsScreen, { type ContributionsTab } from './ContributionsScreen';
import type Paragraph from '../../db/models/Paragraph';

const SOURCE_ID = 'philosophie-der-freiheit';
const LOCAL_USER = 'local';

type Segment = { segmentIndex: number; segmentTitle: string; segmentType: string };

export default function ReadScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { target } = useReading();

  const [allParagraphs, setAllParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [noteCounts, setNoteCounts] = useState<Map<string, number>>(new Map());
  const [menuParagraph, setMenuParagraph] = useState<Paragraph | null>(null);
  const [menuMode, setMenuMode] = useState<'menu' | 'editor'>('menu');
  const [noteContent, setNoteContent] = useState('');
  const [contributionsParagraph, setContributionsParagraph] = useState<Paragraph | null>(null);
  const [contributionsTab, setContributionsTab] = useState<ContributionsTab>('notes');

  const listRef = useRef<FlatList<Paragraph>>(null);

  useEffect(() => {
    const sub = ParagraphRepository.observeBySource(SOURCE_ID).subscribe((ps) => {
      setAllParagraphs(ps);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = BookmarkRepository.observeBySource(SOURCE_ID).subscribe((bookmarks) => {
      setBookmarkedIds(new Set(bookmarks.map((b) => b.paragraphId)));
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
    return segments[0]?.segmentIndex ?? 0;
  }, [target.segmentIndex, segments]);

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

  const { navigateToRead } = useReading();

  useEffect(() => {
    if (!target.paragraphId || chapterParagraphs.length === 0) return;
    const idx = chapterParagraphs.findIndex((p) => p.paragraphId === target.paragraphId);
    if (idx >= 0) {
      listRef.current?.scrollToIndex({ index: idx, animated: true, viewOffset: 8 });
    }
  }, [target.paragraphId, chapterParagraphs]);

  const handleLongPress = useCallback((p: Paragraph) => setMenuParagraph(p), []);

  const handleToggleBookmark = useCallback(async () => {
    if (!menuParagraph) return;
    await BookmarkRepository.toggle(LOCAL_USER, SOURCE_ID, menuParagraph.paragraphId);
    setMenuParagraph(null);
  }, [menuParagraph]);

  const handleOpenNoteEditor = useCallback(() => {
    setNoteContent('');
    setMenuMode('editor');
  }, []);

  const handleSaveNote = useCallback(async () => {
    const trimmed = noteContent.trim();
    if (trimmed && menuParagraph) {
      await NoteRepository.create({
        userId: LOCAL_USER,
        paragraphId: menuParagraph.paragraphId,
        segmentId: `${SOURCE_ID}:${menuParagraph.segmentIndex}`,
        sourceId: SOURCE_ID,
        content: trimmed,
      });
    }
    setMenuParagraph(null);
    setMenuMode('menu');
  }, [noteContent, menuParagraph]);

  const handleCloseMenu = useCallback(() => {
    setMenuParagraph(null);
    setMenuMode('menu');
  }, []);

  const openContributions = useCallback((p: Paragraph, tab: ContributionsTab) => {
    setContributionsParagraph(p);
    setContributionsTab(tab);
  }, []);

  const renderItem = useCallback(({ item }: { item: Paragraph }) => {
    const noteCount = noteCounts.get(item.paragraphId) ?? 0;
    const conversationCount = 0;
    const ragCount = 0;
    const hasContributions = noteCount > 0 || conversationCount > 0 || ragCount > 0;
    const openTab = (tab: ContributionKind) => openContributions(item, tab);
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
            <Text style={[styles.paragraphNumber, { color: colors.onSurfaceVariant }]}>
              {item.paragraphNumber}{'| '}
            </Text>
          }
        />
        {hasContributions && (
          <View style={styles.contributionStrip}>
            <ContributionCountButton kind="notes" count={noteCount} onPress={() => openTab('notes')} />
            <ContributionCountButton kind="conversations" count={conversationCount} onPress={() => openTab('conversations')} />
            <ContributionCountButton kind="rag" count={ragCount} onPress={() => openTab('rag')} />
          </View>
        )}
      </TouchableOpacity>
    );
  }, [noteCounts, colors, handleLongPress, openContributions]);

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const isBookmarked = menuParagraph ? bookmarkedIds.has(menuParagraph.paragraphId) : false;
  const typeLabel = currentSegment?.segmentType === 'preface' ? 'Vorwort' : 'Kapitel';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Kapitel-Header */}
      <View style={[styles.chapterHeader, { borderBottomColor: colors.outlineVariant }]}>
        <Text style={[typography.labelSmall, { color: colors.primary }]}>{typeLabel}</Text>
        <Text style={[typography.titleMedium, { color: colors.onBackground, flex: 1 }]} numberOfLines={2}>
          {currentSegment?.segmentTitle}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={chapterParagraphs}
        keyExtractor={(p) => p.paragraphId}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        onScrollToIndexFailed={() => {}}
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

      {/* Long-Press-Menü + Notiz-Editor (ein einziger Modal) */}
      <Modal
        visible={menuParagraph !== null}
        transparent
        animationType="fade"
        onRequestClose={handleCloseMenu}
      >
        {menuMode === 'menu' ? (
          <Pressable style={styles.overlay} onPress={handleCloseMenu}>
            <View style={[styles.menu, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}>
                Absatz {menuParagraph?.paragraphNumber}
              </Text>
              <TouchableOpacity style={styles.menuRow} onPress={handleToggleBookmark}>
                <Ionicons
                  name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                  size={20}
                  color={colors.primary}
                />
                <Text style={[typography.bodyLarge, { color: colors.onSurface }]}>
                  {isBookmarked ? 'Lesezeichen entfernen' : 'Lesezeichen setzen'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuRow} onPress={handleOpenNoteEditor}>
                <Ionicons name="pencil-outline" size={20} color={colors.primary} />
                <Text style={[typography.bodyLarge, { color: colors.onSurface }]}>
                  Notiz erstellen
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        ) : (
          <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={styles.overlay} onPress={handleCloseMenu} />
            <View style={[styles.menu, { backgroundColor: colors.surfaceContainer, gap: spacing.s }]}>
              <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                Absatz {menuParagraph?.paragraphNumber} · {currentSegment?.segmentTitle}
              </Text>
              <TextInput
                style={[styles.noteInput, { color: colors.onSurface, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLow }]}
                multiline
                autoFocus
                placeholder="Notiz eingeben..."
                placeholderTextColor={colors.onSurfaceVariant}
                value={noteContent}
                onChangeText={setNoteContent}
              />
              <View style={styles.noteActions}>
                <TouchableOpacity style={styles.noteBtn} onPress={handleCloseMenu}>
                  <Text style={[typography.labelLarge, { color: colors.onSurfaceVariant }]}>Abbrechen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.noteBtn, styles.noteBtnFilled, { backgroundColor: colors.primary }]} onPress={handleSaveNote}>
                  <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>Speichern</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>

      <ContributionsScreen
        visible={contributionsParagraph !== null}
        onClose={() => setContributionsParagraph(null)}
        paragraph={contributionsParagraph}
        sourceId={SOURCE_ID}
        initialTab={contributionsTab}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  chapterHeader: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  list: { flex: 1 },
  listContent: { padding: spacing.m, gap: spacing.m },
  paragraphWrap: { gap: 4 },
  paragraphNumber: {
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
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
  flex: { flex: 1 },
  noteInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: spacing.s,
    minHeight: 120,
    fontSize: 16,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.s },
  noteBtn: { paddingVertical: spacing.s, paddingHorizontal: spacing.m, borderRadius: 20 },
  noteBtnFilled: {},
});
