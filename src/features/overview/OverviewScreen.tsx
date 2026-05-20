import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, ActivityIndicator, Modal,
} from 'react-native';
import AppBar from '@/shared/components/AppBar';
import { ICONS, ICON_SIZES } from '@/shared/theme';
import AppIcon from '@/shared/components/AppIcon';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';

import { BookmarkRepository } from '@/data/repositories/BookmarkRepository';
import { useReading } from '@/shared/contexts/ReadingContext';
import type Paragraph from '@/data/db/models/Paragraph';

import {
  SOURCE_DETAIL,
  SEGMENT_SUMMARY_DEMO,
  continueReadingLabel,
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

type ViewMode = 'grid' | 'detail';

export default function OverviewScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { navigateToRead } = useReading();

  const [mode, setMode] = useState<ViewMode>('grid');
  const [segments, setSegments] = useState<Segment[]>([]);
  const [lastReadParagraphId, setLastReadParagraphId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [summaryOverlay, setSummaryOverlay] = useState<{ segmentIndex: number; title: string; summary: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = ParagraphRepository.observeBySource(SOURCE_DETAIL.id).subscribe((ps) => {
      setSegments(groupBySegment(ps));
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = BookmarkRepository.observeManualBookmarks(SOURCE_DETAIL.id).subscribe((bms) => {
      setBookmarkedIds(bms.map((b) => b.paragraphId));
    });
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

  const continueSegmentTitle = useMemo(() => {
    if (!lastReadParagraphId) return null;
    const seg = segments.find((s) =>
      s.paragraphs.some((p) => p.paragraphId === lastReadParagraphId),
    );
    return seg?.segmentTitle ?? null;
  }, [lastReadParagraphId, segments]);

  const paragraphMap = useMemo(() => {
    const map = new Map<string, { paragraph: Paragraph; segmentTitle: string }>();
    for (const seg of segments) {
      for (const p of seg.paragraphs) {
        map.set(p.paragraphId, { paragraph: p, segmentTitle: seg.segmentTitle });
      }
    }
    return map;
  }, [segments]);

  const bookmarkedParagraphs = useMemo(() =>
    bookmarkedIds
      .map((id) => paragraphMap.get(id))
      .filter((x): x is { paragraph: Paragraph; segmentTitle: string } => x != null),
  [bookmarkedIds, paragraphMap]);

  const bookmarkedSorted = useMemo(() =>
    [...bookmarkedParagraphs].sort(
      (a, b) =>
        a.paragraph.segmentIndex - b.paragraph.segmentIndex ||
        a.paragraph.paragraphNumber - b.paragraph.paragraphNumber,
    ),
  [bookmarkedParagraphs]);

  const [bookmarkDropdownOpen, setBookmarkDropdownOpen] = useState(false);


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
          </View>
        </View>

        <View style={[
          styles.continueCard,
          { backgroundColor: colors.primaryContainer },
          bookmarkedSorted.length > 0 && styles.continueCardExpanded,
        ]}>
          {/* Weiterlesen-Hauptzeile */}
          <View style={styles.continueTopRow}>
            <TouchableOpacity
              style={styles.continueMain}
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
            {bookmarkedSorted.length > 0 && (
              <>
                <View style={[styles.continueVertDivider, { backgroundColor: colors.onPrimaryContainer }]} />
                <TouchableOpacity
                  style={styles.continueChevronBtn}
                  onPress={() => setBookmarkDropdownOpen((v) => !v)}
                  activeOpacity={0.7}
                  hitSlop={8}
                >
                  <AppIcon
                    name={bookmarkDropdownOpen ? ICONS.nav.collapseSummary : ICONS.nav.expandSummary}
                    size={20}
                    color={colors.onPrimaryContainer}
                  />
                </TouchableOpacity>
              </>
            )}
          </View>

          {/* Lesezeichen-Dropdown */}
          {bookmarkDropdownOpen && bookmarkedSorted.map(({ paragraph, segmentTitle }) => (
            <React.Fragment key={paragraph.paragraphId}>
              <View style={[styles.continueHorizDivider, { backgroundColor: colors.onPrimaryContainer }]} />
              <TouchableOpacity
                style={styles.continueBookmarkRow}
                onPress={() => {
                  navigateToRead({ segmentIndex: null, paragraphId: paragraph.paragraphId });
                  setBookmarkDropdownOpen(false);
                }}
                activeOpacity={0.7}
              >
                <AppIcon name={ICONS.context.bookmark} size={14} color={colors.onPrimaryContainer} style={styles.continueBookmarkIcon} />
                <View style={styles.continueBookmarkText}>
                  <Text style={[textStyles.noteMeta, { color: colors.onPrimaryContainer, opacity: 0.65 }]} numberOfLines={1}>
                    {segmentTitle} · ¶{paragraph.paragraphNumber}
                  </Text>
                  <Text style={[textStyles.chapterTitle, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
                    {paragraph.textRaw.replace(/\u00AD/g, '').trim()}
                  </Text>
                </View>
              </TouchableOpacity>
            </React.Fragment>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          {segments.map((seg, i) => {
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
                  </TouchableOpacity>
                  {summary ? (
                    <Pressable
                      style={styles.summaryBtn}
                      onPress={() => setSummaryOverlay({ segmentIndex: seg.segmentIndex, title: seg.segmentTitle, summary })}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel="Zusammenfassung anzeigen"
                    >
                      <AppIcon
                        name={ICONS.context.summary}
                        size={20}
                        color={colors.onSurfaceVariant}
                      />
                    </Pressable>
                  ) : null}
                </View>
              </React.Fragment>
            );
          })}
        </View>
      </ScrollView>

      {/* Zusammenfassungs-Overlay */}
      <Modal
        visible={summaryOverlay !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSummaryOverlay(null)}
      >
        <Pressable style={styles.overlayBackdrop} onPress={() => setSummaryOverlay(null)} />
        {summaryOverlay && (
          <View style={[styles.overlaySheet, { backgroundColor: colors.surfaceContainerHigh }]}>
            <View style={[styles.overlayHandle, { backgroundColor: colors.outlineVariant }]} />
            <Text style={[textStyles.labelSection, { color: colors.primary, marginBottom: spacing.xs }]}>
              Zusammenfassung
            </Text>
            <Text style={[textStyles.readingChapterTitle, { color: colors.onBackground, marginBottom: spacing.m }]}>
              {summaryOverlay.title}
            </Text>
            <Text style={[textStyles.aiSummary, { color: colors.onSurface, marginBottom: spacing.l }]}>
              {summaryOverlay.summary}
            </Text>
            <TouchableOpacity
              style={[styles.overlayReadBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                navigateToRead({ segmentIndex: summaryOverlay.segmentIndex, paragraphId: null });
                setSummaryOverlay(null);
              }}
              activeOpacity={0.85}
            >
              <AppIcon name={ICONS.tab.read} size={16} color={colors.onPrimary} />
              <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>
                Kapitel lesen
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>
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
  continueCard: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  continueCardExpanded: {
    borderRadius: 16,
  },
  continueTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    paddingHorizontal: spacing.l,
  },
  continueVertDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginVertical: spacing.s,
    opacity: 0.35,
  },
  continueChevronBtn: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueHorizDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: spacing.m,
    opacity: 0.3,
  },
  continueBookmarkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  continueBookmarkIcon: {
    marginTop: 3,
  },
  continueBookmarkText: {
    flex: 1,
    gap: 2,
  },
  card: { borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.m,
    gap: spacing.s,
  },
  rowMain: { flex: 1, gap: 4 },
  summaryBtn: {
    paddingTop: 2,
    paddingLeft: 4,
  },
  overlayBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  overlaySheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: spacing.l,
    paddingBottom: spacing.xxl,
    gap: 0,
  },
  overlayHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.m,
  },
  overlayReadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    paddingVertical: spacing.m,
    borderRadius: 24,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.m },
});
