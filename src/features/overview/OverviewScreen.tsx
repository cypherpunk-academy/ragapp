import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme, ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import AppBar from '../../components/AppBar';
import { lightColors, darkColors, spacing, typography, textStyles } from '../../theme';
import { ParagraphRepository } from '../../repositories/ParagraphRepository';
import { NoteRepository } from '../../repositories/NoteRepository';
import { useReading } from '../../contexts/ReadingContext';
import ContributionCountButton from '../../components/ContributionCountButton';
import type Paragraph from '../../db/models/Paragraph';

type Segment = {
  segmentIndex: number;
  segmentTitle: string;
  segmentType: string;
  paragraphs: Paragraph[];
};

function groupBySegment(paragraphs: Paragraph[]): Segment[] {
  const map = new Map<number, Segment>();
  for (const p of paragraphs) {
    if (!map.has(p.segmentIndex)) {
      map.set(p.segmentIndex, {
        segmentIndex: p.segmentIndex,
        segmentTitle: p.segmentTitle,
        segmentType: p.segmentType,
        paragraphs: [],
      });
    }
    map.get(p.segmentIndex)!.paragraphs.push(p);
  }
  return Array.from(map.values()).sort((a, b) => a.segmentIndex - b.segmentIndex);
}

const SOURCE_ID = 'philosophie-der-freiheit';
const BOOK_TITLE = 'Die Philosophie der Freiheit';
const BOOK_AUTHOR = 'Rudolf Steiner';

const BOOKS = [
  { id: SOURCE_ID, title: BOOK_TITLE, author: BOOK_AUTHOR },
];

type ViewMode = 'grid' | 'detail';

export default function OverviewScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { navigateToRead } = useReading();

  const [mode, setMode] = useState<ViewMode>('grid');
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [noteCount, setNoteCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = ParagraphRepository.observeBySource(SOURCE_ID).subscribe((ps) => {
      setSegments(groupBySegment(ps));
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = NoteRepository.observeBySource(SOURCE_ID).subscribe((notes) => {
      setNoteCount(notes.length);
    });
    return () => sub.unsubscribe();
  }, []);

  const selectedBook = useMemo(
    () => BOOKS.find((b) => b.id === selectedBookId) ?? null,
    [selectedBookId],
  );

  const typeLabel = (type: string) => (type === 'preface' ? 'Vorwort' : 'Kapitel');
  const typeIcon = (type: string): React.ComponentProps<typeof MaterialIcons>['name'] =>
    type === 'preface' ? 'description' : 'menu-book';

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (mode === 'grid') {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppBar title="Übersicht" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.grid}>
            {BOOKS.map((book) => (
              <TouchableOpacity
                key={book.id}
                style={styles.coverCard}
                onPress={() => {
                  setSelectedBookId(book.id);
                  setMode('detail');
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.coverPlaceholder, { backgroundColor: colors.secondaryContainer }]}>
                  <MaterialIcons name="menu-book" size={32} color={colors.onSecondaryContainer} />
                </View>
                <Text
                  style={[textStyles.titleCard, { color: colors.onSurface }]}
                  numberOfLines={3}
                >
                  {book.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title="" onBackPress={() => setMode('grid')} />
      <ScrollView contentContainerStyle={styles.content}>

      <View style={[styles.hero, { backgroundColor: colors.surfaceContainer }]}>
        <View style={[styles.heroCover, { backgroundColor: colors.secondaryContainer }]}>
          <MaterialIcons name="menu-book" size={40} color={colors.onSecondaryContainer} />
        </View>
        <View style={styles.heroText}>
          <Text style={[textStyles.titlePage, { color: colors.onBackground }]}>
            {selectedBook?.title ?? BOOK_TITLE}
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
            {selectedBook?.author ?? BOOK_AUTHOR}
          </Text>
          {(noteCount > 0) && (
            <View style={styles.heroStrip}>
              <ContributionCountButton kind="notes" count={noteCount} />
            </View>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.continueBtn, { backgroundColor: colors.primaryContainer }]}
        onPress={() => navigateToRead({ segmentIndex: null, paragraphId: null })}
      >
        <MaterialIcons name="menu-book" size={18} color={colors.onPrimaryContainer} />
        <Text style={[typography.labelLarge, { color: colors.onPrimaryContainer }]}>Weiterlesen</Text>
      </TouchableOpacity>

      <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
        {segments.map((seg, i) => (
          <React.Fragment key={seg.segmentIndex}>
            {i > 0 && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
            <TouchableOpacity
              style={styles.row}
              onPress={() => navigateToRead({ segmentIndex: seg.segmentIndex, paragraphId: null })}
              activeOpacity={0.7}
            >
              <View style={[styles.iconWrap, { backgroundColor: colors.secondaryContainer }]}>
                <MaterialIcons name={typeIcon(seg.segmentType)} size={18} color={colors.onSecondaryContainer} />
              </View>
              <View style={styles.rowText}>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                  {typeLabel(seg.segmentType)}
                </Text>
                <Text style={[typography.bodyLarge, { color: colors.onSurface }]} numberOfLines={2}>
                  {seg.segmentTitle}
                </Text>
                <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                  {seg.paragraphs.length} Absätze
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={18} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.m, paddingTop: spacing.l, gap: spacing.m },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.m,
    justifyContent: 'center',
  },
  coverCard: {
    width: 146,
    gap: spacing.s,
  },
  coverPlaceholder: {
    aspectRatio: 2 / 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  hero: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: spacing.m,
    gap: spacing.m,
  },
  heroCover: {
    width: 72,
    height: 108,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroText: { flex: 1, gap: 4 },
  heroStrip: { flexDirection: 'row', gap: 8, marginTop: spacing.s },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    padding: spacing.m,
    borderRadius: 12,
  },
  card: { borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.m,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 2 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.m },
});
