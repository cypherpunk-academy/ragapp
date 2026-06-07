import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, ActivityIndicator, Modal, Image,
} from 'react-native';
import { config } from '@/data/lib/config';
import AppBar from '@/shared/components/AppBar';
import { ICONS, ICON_SIZES } from '@/shared/theme';
import AppIcon from '@/shared/components/AppIcon';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { SourceRepository } from '@/data/repositories/SourceRepository';
import { BookmarkRepository } from '@/data/repositories/BookmarkRepository';
import { useReading } from '@/shared/contexts/ReadingContext';
import type Paragraph from '@/data/db/models/Paragraph';
import type Source from '@/data/db/models/Source';
import { continueReadingLabel } from './sourceDetail';

type Segment = {
  segmentIndex: number;
  segmentTitle: string;
  paragraphs: Paragraph[];
};

function groupBySegment(paragraphs: Paragraph[]): Segment[] {
  const map = new Map<number, Segment>();
  for (const p of paragraphs) {
    if (!map.has(p.segmentIndex)) {
      map.set(p.segmentIndex, { segmentIndex: p.segmentIndex, segmentTitle: p.segmentTitle, paragraphs: [] });
    }
    map.get(p.segmentIndex)!.paragraphs.push(p);
  }
  return Array.from(map.values()).sort((a, b) => a.segmentIndex - b.segmentIndex);
}

export default function OverviewScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { navigateToRead } = useReading();

  const [failedCovers, setFailedCovers] = useState<Set<string>>(new Set());

  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSource, setSelectedSource] = useState<Source | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [lastReadParagraphId, setLastReadParagraphId] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [summaryOverlay, setSummaryOverlay] = useState<{ segmentIndex: number; title: string } | null>(null);
  const [loadingSources, setLoadingSources] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [bookmarkDropdownOpen, setBookmarkDropdownOpen] = useState(false);

  // Load all sources
  useEffect(() => {
    const sub = SourceRepository.observePrimary().subscribe((s) => {
      setSources(s);
      setLoadingSources(false);
    });
    return () => sub.unsubscribe();
  }, []);

  // Load segments when a source is selected
  useEffect(() => {
    if (!selectedSource) { setSegments([]); return; }
    setLoadingDetail(true);
    const sub = ParagraphRepository.observeBySource(selectedSource.id).subscribe((ps) => {
      setSegments(groupBySegment(ps));
      setLoadingDetail(false);
    });
    return () => sub.unsubscribe();
  }, [selectedSource?.id]);

  // Load bookmarks for selected source
  useEffect(() => {
    if (!selectedSource) { setBookmarkedIds([]); return; }
    const sub = BookmarkRepository.observeManualBookmarks(selectedSource.id).subscribe((bms) => {
      setBookmarkedIds(bms.map((b) => b.paragraphId));
    });
    return () => sub.unsubscribe();
  }, [selectedSource?.id]);

  // Load last-read for selected source
  useEffect(() => {
    if (!selectedSource) { setLastReadParagraphId(null); return; }
    const sub = BookmarkRepository.observeLastRead(selectedSource.id).subscribe((rows) => {
      if (rows.length === 0) { setLastReadParagraphId(null); return; }
      const sorted = [...rows].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
      setLastReadParagraphId(sorted[0]?.paragraphId ?? null);
    });
    return () => sub.unsubscribe();
  }, [selectedSource?.id]);

  const continueSegmentTitle = useMemo(() => {
    if (!lastReadParagraphId) return null;
    return segments.find((s) => s.paragraphs.some((p) => p.id === lastReadParagraphId))?.segmentTitle ?? null;
  }, [lastReadParagraphId, segments]);

  const paragraphMap = useMemo(() => {
    const map = new Map<string, { paragraph: Paragraph; segmentTitle: string }>();
    for (const seg of segments) {
      for (const p of seg.paragraphs) {
        map.set(p.id, { paragraph: p, segmentTitle: seg.segmentTitle });
      }
    }
    return map;
  }, [segments]);

  const bookmarkedSorted = useMemo(() =>
    bookmarkedIds
      .map((id) => paragraphMap.get(id))
      .filter((x): x is { paragraph: Paragraph; segmentTitle: string } => x != null)
      .sort((a, b) =>
        a.paragraph.segmentIndex - b.paragraph.segmentIndex ||
        a.paragraph.paragraphNumber - b.paragraph.paragraphNumber,
      ),
  [bookmarkedIds, paragraphMap]);

  // ── Grid (source list) ────────────────────────────────────────────────────
  if (!selectedSource) {
    if (loadingSources) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }

    if (sources.length === 0) {
      return (
        <View style={[styles.center, { backgroundColor: colors.background }]}>
          <AppBar title="Übersicht" />
          <Text style={[textStyles.chapterTitle, { color: colors.onSurfaceVariant }]}>
            Noch keine Bücher synchronisiert.
          </Text>
        </View>
      );
    }

    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <AppBar title="Übersicht" />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.grid}>
            {sources.map((source) => (
              <TouchableOpacity
                key={source.id}
                style={styles.coverCard}
                onPress={() => setSelectedSource(source)}
                activeOpacity={0.8}
              >
                <View style={[styles.coverBox, { backgroundColor: colors.secondaryContainer }]}>
                  {failedCovers.has(source.id) ? (
                    <AppIcon name={ICONS.tab.read} size={ICON_SIZES.hero} color={colors.onSecondaryContainer} />
                  ) : (
                    <Image
                      source={{ uri: `${config.supabase.url}/storage/v1/object/public/covers/${source.id}.png` }}
                      style={StyleSheet.absoluteFill}
                      resizeMode="cover"
                      onError={() => setFailedCovers((prev) => new Set([...prev, source.id]))}
                    />
                  )}
                </View>
                <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, textAlign: 'center' }]} numberOfLines={1}>
                  {source.author}
                </Text>
                <Text style={[textStyles.titleCard, { color: colors.onSurface, textAlign: 'center' }]} numberOfLines={3}>
                  {source.title}
                </Text>
                {source.year ? (
                  <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                    {source.year}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  }

  // ── Detail (selected source) ───────────────────────────────────────────────
  if (loadingDetail) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title="" onBackPress={() => { setSelectedSource(null); setBookmarkDropdownOpen(false); }} />
      <ScrollView contentContainerStyle={styles.content}>

        <View style={[styles.hero, { backgroundColor: colors.surfaceContainer }]}>
          <TouchableOpacity
            style={[styles.heroCover, { backgroundColor: colors.secondaryContainer }]}
            onPress={() => navigateToRead({ sourceId: selectedSource.id, segmentIndex: null, paragraphId: null })}
            activeOpacity={0.8}
          >
            {failedCovers.has(selectedSource.id) ? (
              <AppIcon name={ICONS.tab.read} size={ICON_SIZES.hero} color={colors.onSecondaryContainer} />
            ) : (
              <Image
                source={{ uri: `${config.supabase.url}/storage/v1/object/public/covers/${selectedSource.id}.png` }}
                style={[StyleSheet.absoluteFill, { borderRadius: 8 }]}
                resizeMode="cover"
                onError={() => setFailedCovers((prev) => new Set([...prev, selectedSource.id]))}
              />
            )}
          </TouchableOpacity>
          <View style={styles.heroText}>
            <TouchableOpacity
              onPress={() => navigateToRead({ sourceId: selectedSource.id, segmentIndex: null, paragraphId: null })}
              activeOpacity={0.8}
            >
              <Text style={[textStyles.titlePage, { color: colors.onBackground }]}>
                {selectedSource.title}
              </Text>
            </TouchableOpacity>
            <Text style={[textStyles.sourceEdition, { color: colors.onSurfaceVariant }]}>
              {selectedSource.author.toUpperCase()}{selectedSource.year ? ` · ${selectedSource.year}` : ''}
            </Text>
          </View>
        </View>

        {lastReadParagraphId && <View style={[
          styles.continueCard,
          { backgroundColor: colors.primaryContainer },
          bookmarkedSorted.length > 0 && styles.continueCardExpanded,
        ]}>
          <View style={styles.continueTopRow}>
            <TouchableOpacity
              style={styles.continueMain}
              onPress={() => {
                const seg = segments.find((s) => s.paragraphs.some((p) => p.id === lastReadParagraphId));
                navigateToRead({ sourceId: selectedSource.id, segmentIndex: seg?.segmentIndex ?? null, paragraphId: lastReadParagraphId });
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

          {bookmarkDropdownOpen && bookmarkedSorted.map(({ paragraph, segmentTitle }) => (
            <React.Fragment key={paragraph.id}>
              <View style={[styles.continueHorizDivider, { backgroundColor: colors.onPrimaryContainer }]} />
              <TouchableOpacity
                style={styles.continueBookmarkRow}
                onPress={() => {
                  navigateToRead({ sourceId: selectedSource.id, segmentIndex: null, paragraphId: paragraph.id });
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
        </View>}

        {segments.length > 0 && (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            {segments.map((seg, i) => (
              <React.Fragment key={seg.segmentIndex}>
                {i > 0 && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
                <View style={styles.row}>
                  <TouchableOpacity
                    style={styles.rowMain}
                    onPress={() => navigateToRead({ sourceId: selectedSource.id, segmentIndex: seg.segmentIndex, paragraphId: null })}
                    activeOpacity={0.7}
                  >
                    <Text style={[textStyles.chapterTitle, { color: colors.onSurface }]} numberOfLines={3}>
                      {seg.segmentTitle}
                    </Text>
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={summaryOverlay !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSummaryOverlay(null)}
      >
        <Pressable style={styles.overlayBackdrop} onPress={() => setSummaryOverlay(null)} />
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.m, paddingTop: spacing.l, gap: spacing.m },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.m, justifyContent: 'center' },
  coverCard: { width: 146, gap: spacing.s },
  coverBox: { aspectRatio: 2 / 3, borderRadius: 8, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xs },
  hero: { flexDirection: 'row', borderRadius: 12, padding: spacing.m, gap: spacing.m },
  heroCover: { width: 72, height: 108, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  heroText: { flex: 1, gap: 6 },
  continueCard: { borderRadius: 24, overflow: 'hidden' },
  continueCardExpanded: { borderRadius: 16 },
  continueTopRow: { flexDirection: 'row', alignItems: 'center' },
  continueMain: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.s, paddingVertical: spacing.m, paddingHorizontal: spacing.l },
  continueVertDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', marginVertical: spacing.s, opacity: 0.35 },
  continueChevronBtn: { paddingHorizontal: spacing.m, paddingVertical: spacing.m, alignItems: 'center', justifyContent: 'center' },
  continueHorizDivider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.m, opacity: 0.3 },
  continueBookmarkRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.s, paddingHorizontal: spacing.m, paddingVertical: spacing.s },
  continueBookmarkIcon: { marginTop: 3 },
  continueBookmarkText: { flex: 1, gap: 2 },
  card: { borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.m, gap: spacing.s },
  rowMain: { flex: 1, gap: 4 },
  overlayBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.m },
});
