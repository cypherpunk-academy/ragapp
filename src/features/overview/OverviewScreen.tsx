import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, ActivityIndicator,
} from 'react-native';
import AppBar from '@/shared/components/AppBar';
import { ICONS, ICON_SIZES } from '@/shared/theme';
import AppIcon from '@/shared/components/AppIcon';
import ContributionStrip, { type ContributionCounts } from '@/shared/components/ContributionStrip';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { TalkRepository } from '@/data/repositories/TalkRepository';

import { BookmarkRepository } from '@/data/repositories/BookmarkRepository';
import { useReading } from '@/shared/contexts/ReadingContext';
import type Paragraph from '@/data/db/models/Paragraph';
import type Note from '@/data/db/models/Note';
import type Talk from '@/data/db/models/Talk';

import {
  SOURCE_DETAIL,
  SEGMENT_SUMMARY_DEMO,
  continueReadingLabel,
  segmentIndexFromNoteIds,
  sourceEditionLine,
} from './sourceDetail';

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

function aggregateNotesBySegment(notes: Note[]): Map<number, ContributionCounts> {
  const map = new Map<number, ContributionCounts>();
  for (const note of notes) {
    const idx = segmentIndexFromNoteIds(note.segmentId, note.paragraphId);
    if (idx === null) continue;
    const cur = map.get(idx) ?? { notes: 0, conversations: 0 };
    cur.notes += 1;
    map.set(idx, cur);
  }
  return map;
}

const EMPTY_COUNTS: ContributionCounts = { notes: 0, conversations: 0 };
const LOCAL_USER = 'local';

function segmentIndexFromParagraphId(paragraphId: string): number | null {
  const parts = paragraphId.split(':');
  if (parts.length < 2) return null;
  const idx = Number.parseInt(parts[1], 10);
  return Number.isNaN(idx) ? null : idx;
}

function mergeSegmentCounts(
  ...parts: Map<number, Partial<ContributionCounts>>[]
): Map<number, ContributionCounts> {
  const merged = new Map<number, ContributionCounts>();
  for (const part of parts) {
    for (const [idx, delta] of part) {
      const cur = merged.get(idx) ?? { ...EMPTY_COUNTS };
      merged.set(idx, {
        notes: cur.notes + (delta.notes ?? 0),
        conversations: cur.conversations + (delta.conversations ?? 0),
      });
    }
  }
  return merged;
}

function aggregateTalksBySegment(talks: Talk[]): Map<number, Partial<ContributionCounts>> {
  const map = new Map<number, Partial<ContributionCounts>>();
  for (const t of talks) {
    const pid = t.contextParagraphId;
    if (!pid) continue;
    const idx = segmentIndexFromParagraphId(pid);
    if (idx === null) continue;
    const cur = map.get(idx) ?? {};
    map.set(idx, { conversations: (cur.conversations ?? 0) + 1 });
  }
  return map;
}


type ViewMode = 'grid' | 'detail';

export default function OverviewScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { navigateToRead } = useReading();

  const [mode, setMode] = useState<ViewMode>('grid');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [talks, setTalks] = useState<Talk[]>([]);
  const [lastReadParagraphId, setLastReadParagraphId] = useState<string | null>(null);
  const [expandedSegments, setExpandedSegments] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = ParagraphRepository.observeBySource(SOURCE_DETAIL.id).subscribe((ps) => {
      setSegments(groupBySegment(ps));
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = NoteRepository.observeBySource(SOURCE_DETAIL.id).subscribe(setNotes);
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = TalkRepository.observeByUser(LOCAL_USER).subscribe(setTalks);
    return () => sub.unsubscribe();
  }, []);


  useEffect(() => {
    const sub = BookmarkRepository.observeLastRead(SOURCE_DETAIL.id).subscribe((rows) => {
      if (rows.length === 0) {
        setLastReadParagraphId(null);
        return;
      }
      const sorted = [...rows].sort(
        (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
      );
      setLastReadParagraphId(sorted[0]?.paragraphId ?? null);
    });
    return () => sub.unsubscribe();
  }, []);

  const segmentNoteCounts = useMemo(() => aggregateNotesBySegment(notes), [notes]);
  const segmentTalkCounts = useMemo(() => aggregateTalksBySegment(talks), [talks]);
  const segmentContributionCounts = useMemo(
    () => mergeSegmentCounts(segmentNoteCounts, segmentTalkCounts),
    [segmentNoteCounts, segmentTalkCounts],
  );

  const werkCounts = useMemo<ContributionCounts>(() => {
    let notes = 0;
    let conversations = 0;
    for (const c of segmentContributionCounts.values()) {
      notes += c.notes;
      conversations += c.conversations;
    }
    return { notes, conversations };
  }, [segmentContributionCounts]);

  const continueSegmentTitle = useMemo(() => {
    if (!lastReadParagraphId) return null;
    const seg = segments.find((s) =>
      s.paragraphs.some((p) => p.paragraphId === lastReadParagraphId),
    );
    return seg?.segmentTitle ?? null;
  }, [lastReadParagraphId, segments]);

  const toggleSummary = (segmentIndex: number) => {
    setExpandedSegments((prev) => {
      const next = new Set(prev);
      if (next.has(segmentIndex)) next.delete(segmentIndex);
      else next.add(segmentIndex);
      return next;
    });
  };

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
            <TouchableOpacity
              style={styles.coverCard}
              onPress={() => setMode('detail')}
              activeOpacity={0.8}
            >
              <View style={[styles.coverBox, { backgroundColor: colors.secondaryContainer }]}>
                <AppIcon name={ICONS.tab.read} size={ICON_SIZES.hero} color={colors.onSecondaryContainer} />
              </View>
              <Text
                style={[textStyles.titleCard, { color: colors.onSurface }]}
                numberOfLines={3}
              >
                {SOURCE_DETAIL.title}
              </Text>
            </TouchableOpacity>
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
          <TouchableOpacity
            style={[styles.heroCover, { backgroundColor: colors.secondaryContainer }]}
            onPress={() => navigateToRead({ segmentIndex: null, paragraphId: null })}
            activeOpacity={0.8}
          >
            <AppIcon name={ICONS.tab.read} size={ICON_SIZES.hero} color={colors.onSecondaryContainer} />
          </TouchableOpacity>
          <View style={styles.heroText}>
            <TouchableOpacity
              onPress={() => navigateToRead({ segmentIndex: null, paragraphId: null })}
              activeOpacity={0.8}
            >
              <Text style={[textStyles.titlePage, { color: colors.onBackground }]}>
                {SOURCE_DETAIL.title}
              </Text>
            </TouchableOpacity>
            <Text style={[textStyles.sourceEdition, { color: colors.onSurfaceVariant }]}>
              {sourceEditionLine()}
            </Text>
            {(werkCounts.notes > 0 || werkCounts.conversations > 0) && (
              <View style={styles.heroStrip}>
                <ContributionStrip counts={werkCounts} />
              </View>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={[styles.continueBtn, { backgroundColor: colors.primaryContainer }]}
          onPress={() => {
            const seg = segments.find((s) =>
              s.paragraphs.some((p) => p.paragraphId === lastReadParagraphId),
            );
            navigateToRead({
              segmentIndex: seg?.segmentIndex ?? null,
              paragraphId: lastReadParagraphId,
            });
          }}
          activeOpacity={0.85}
        >
          <AppIcon name={ICONS.tab.read} size={ICON_SIZES.menu} color={colors.onPrimaryContainer} />
          <Text style={[textStyles.continueCta, { color: colors.onPrimaryContainer }]}>
            {continueReadingLabel(continueSegmentTitle)}
          </Text>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          {segments.map((seg, i) => {
            const counts = segmentContributionCounts.get(seg.segmentIndex) ?? EMPTY_COUNTS;
            const hasStrip = counts.notes > 0 || counts.conversations > 0;
            const expanded = expandedSegments.has(seg.segmentIndex);
            const summary = SEGMENT_SUMMARY_DEMO[seg.segmentIndex];

            return (
              <React.Fragment key={seg.segmentIndex}>
                {i > 0 && (
                  <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
                )}
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.rowMain}
                    onPress={() => navigateToRead({ segmentIndex: seg.segmentIndex, paragraphId: null })}
                    activeOpacity={0.7}
                  >
                    <Text style={[textStyles.chapterTitle, { color: colors.onSurface }]} numberOfLines={3}>
                      {seg.segmentTitle}
                    </Text>
                    {hasStrip && (
                      <View style={styles.rowStrip}>
                        <ContributionStrip counts={counts} />
                      </View>
                    )}
                    {expanded && summary ? (
                      <Text style={[textStyles.aiSummary, { color: colors.onSurfaceVariant, marginTop: spacing.s }]}>
                        {summary}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                  {summary ? (
                    <Pressable
                      style={styles.expandChevron}
                      onPress={() => toggleSummary(seg.segmentIndex)}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={expanded ? 'Zusammenfassung einklappen' : 'Zusammenfassung anzeigen'}
                    >
                      <AppIcon
                        name={expanded ? ICONS.nav.collapseSummary : ICONS.nav.expandSummary}
                        size={22}
                        color={expanded ? colors.primary : colors.onSurfaceVariant}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </React.Fragment>
            );
          })}
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
  coverCard: { width: 146, gap: spacing.s },
  coverBox: {
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
  heroText: { flex: 1, gap: 6 },
  heroStrip: { marginTop: spacing.xs },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
    borderRadius: 24,
  },
  card: { borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.m,
    gap: spacing.s,
  },
  rowMain: { flex: 1, gap: 4 },
  rowStrip: { marginTop: 4 },
  expandChevron: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.m },
});
