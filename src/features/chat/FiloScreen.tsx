import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import AppBar from '@/shared/components/AppBar';
import AppIcon from '@/shared/components/AppIcon';
import { ICONS, ICON_SIZES, lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { assistant } from '@/shared/lib/assistant';
import { useReading } from '@/shared/contexts/ReadingContext';
import { BookmarkRepository } from '@/data/repositories/BookmarkRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { continueReadingLabel } from '@/features/overview/sourceDetail';
import ChatTab from './ChatTab';
import GespraecheTab from './GespraecheTab';

type FiloSegment = 'chat' | 'gespraeche';

const SEGMENTS: { id: FiloSegment; label: string }[] = [
  { id: 'chat', label: 'CHAT' },
  { id: 'gespraeche', label: 'GESPRÄCHE' },
];

type WeiterlesenState = {
  sourceId: string;
  segmentIndex: number | null;
  paragraphId: string;
  segmentTitle: string | null;
};

type Props = {
  /** Filo ist der sichtbare Haupt-Tab (Pager Index 0). */
  isFiloTabActive?: boolean;
  /** App wurde mit Filo als Start-Tab geöffnet (nicht z. B. wiederhergestellter Lesen-Tab). */
  offerWeiterlesenOnLaunch?: boolean;
};

/**
 * Filo-Tab (Position 0, Start-Tab der App).
 * Zwei innere Reiter (Segmented Control, kein eigener PagerView-Index): CHAT / GESPRÄCHE.
 */
export default function FiloScreen({
  isFiloTabActive = true,
  offerWeiterlesenOnLaunch = true,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const {
    chatTalkId, chatPendingLinkNoteId, consumeChatPendingLink,
    chatPendingParagraphId, consumeChatPendingParagraph, navigateToRead,
  } = useReading();

  const [activeSegment, setActiveSegment] = useState<FiloSegment>('chat');
  const [activeTalkId, setActiveTalkId] = useState<string | null>(null);
  const [weiterlesen, setWeiterlesen] = useState<WeiterlesenState | null>(null);
  const [weiterlesenDismissed, setWeiterlesenDismissed] = useState(false);
  const [pendingLinkNoteId, setPendingLinkNoteId] = useState<string | null>(null);
  const [pendingParagraphId, setPendingParagraphId] = useState<string | null>(null);

  const showWeiterlesen = offerWeiterlesenOnLaunch
    && isFiloTabActive
    && weiterlesen != null
    && !weiterlesenDismissed;

  // Aus dem ReadingContext vorgeladenes Gespräch übernehmen (z. B. aus Suche/Lesen).
  useEffect(() => {
    if (chatTalkId) {
      setActiveTalkId(chatTalkId);
      setActiveSegment('chat');
    }
  }, [chatTalkId]);

  // Vorgemerkte Note zum Verknüpfen übernehmen (z. B. „Mit Philo bearbeiten" von Absatz/Kapitel/Buch).
  useEffect(() => {
    if (chatPendingLinkNoteId) {
      setPendingLinkNoteId(chatPendingLinkNoteId);
      setActiveSegment('chat');
      consumeChatPendingLink();
    }
  }, [chatPendingLinkNoteId, consumeChatPendingLink]);

  // Vorgemerkter Absatz zur Verankerung eines neuen Gesprächs (z. B. „Philo zu diesem Absatz fragen").
  useEffect(() => {
    if (chatPendingParagraphId) {
      setPendingParagraphId(chatPendingParagraphId);
      setActiveSegment('chat');
      consumeChatPendingParagraph();
    }
  }, [chatPendingParagraphId, consumeChatPendingParagraph]);

  // Globale letzte Lesestelle über alle Quellen hinweg, für den WEITERLESEN-Hinweis.
  useEffect(() => {
    const sub = BookmarkRepository.observeGlobalLastRead().subscribe(async (rows) => {
      if (rows.length === 0) {
        setWeiterlesen(null);
        return;
      }
      const latest = [...rows].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())[0]!;
      const paragraph = await ParagraphRepository.findById(latest.paragraphId);
      if (!paragraph) {
        setWeiterlesen(null);
        return;
      }
      setWeiterlesen({
        sourceId: paragraph.sourceId,
        segmentIndex: paragraph.segmentIndex,
        paragraphId: paragraph.id,
        segmentTitle: paragraph.segmentTitle,
      });
    });
    return () => sub.unsubscribe();
  }, []);

  // Einmal pro App-Start: Banner verschwindet beim Verlassen des Filo-Tabs ohne Tap.
  useEffect(() => {
    if (!isFiloTabActive && offerWeiterlesenOnLaunch) {
      setWeiterlesenDismissed(true);
    }
  }, [isFiloTabActive, offerWeiterlesenOnLaunch]);

  const handleWeiterlesen = useCallback(() => {
    if (!weiterlesen) return;
    setWeiterlesenDismissed(true);
    navigateToRead({
      sourceId: weiterlesen.sourceId,
      segmentIndex: weiterlesen.segmentIndex,
      paragraphId: weiterlesen.paragraphId,
    });
  }, [weiterlesen, navigateToRead]);

  const handleSelectTalk = useCallback((talkId: string) => {
    setActiveTalkId(talkId);
    setActiveSegment('chat');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBar title={assistant.firstName} />

      {showWeiterlesen && (
        <TouchableOpacity
          style={[styles.weiterlesen, { backgroundColor: colors.primaryContainer }]}
          onPress={handleWeiterlesen}
          activeOpacity={0.85}
        >
          <AppIcon name={ICONS.tab.read} size={ICON_SIZES.menu} color={colors.onPrimaryContainer} />
          <Text style={[textStyles.continueCta, { color: colors.onPrimaryContainer }]} numberOfLines={1}>
            {continueReadingLabel(weiterlesen.segmentTitle)}
          </Text>
        </TouchableOpacity>
      )}

      <View style={[styles.segmented, { borderBottomColor: colors.outlineVariant }]}>
        {SEGMENTS.map((seg) => {
          const isActive = seg.id === activeSegment;
          return (
            <TouchableOpacity
              key={seg.id}
              style={[styles.segment, isActive && { borderBottomColor: colors.primary }]}
              onPress={() => setActiveSegment(seg.id)}
              activeOpacity={0.7}
            >
              <Text style={[typography.labelMedium, { color: isActive ? colors.primary : colors.onSurfaceVariant }]}>
                {seg.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.content}>
        {activeSegment === 'chat' && (
          <ChatTab
            activeTalkId={activeTalkId}
            onActiveTalkChange={setActiveTalkId}
            linkNoteId={pendingLinkNoteId}
            onLinkNoteConsumed={() => setPendingLinkNoteId(null)}
            pendingParagraphId={pendingParagraphId}
            onParagraphConsumed={() => setPendingParagraphId(null)}
          />
        )}
        {activeSegment === 'gespraeche' && <GespraecheTab onSelectTalk={handleSelectTalk} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  weiterlesen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  segmented: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.s,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  content: { flex: 1 },
});
