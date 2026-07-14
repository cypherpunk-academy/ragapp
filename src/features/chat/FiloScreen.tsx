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
import ArbeitstexteScreen from './ArbeitstexteScreen';

type FiloSegment = 'chat' | 'gespraeche' | 'arbeitstexte';

const SEGMENTS: { id: FiloSegment; label: string }[] = [
  { id: 'chat', label: 'CHAT' },
  { id: 'gespraeche', label: 'GESPRÄCHE' },
  { id: 'arbeitstexte', label: 'ARBEITSTEXTE' },
];

type WeiterlesenState = {
  sourceId: string;
  segmentIndex: number | null;
  paragraphId: string;
  segmentTitle: string | null;
};

/**
 * Filo-Tab (Position 0, Start-Tab der App).
 * Drei innere Reiter (Segmented Control, kein eigener PagerView-Index): CHAT / GESPRÄCHE / ARBEITSTEXTE.
 */
export default function FiloScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { chatTalkId, navigateToRead } = useReading();

  const [activeSegment, setActiveSegment] = useState<FiloSegment>('chat');
  const [activeTalkId, setActiveTalkId] = useState<string | null>(null);
  const [weiterlesen, setWeiterlesen] = useState<WeiterlesenState | null>(null);
  const [pendingLinkNoteId, setPendingLinkNoteId] = useState<string | null>(null);

  // Aus dem ReadingContext vorgeladenes Gespräch übernehmen (z. B. aus Suche/Lesen).
  useEffect(() => {
    if (chatTalkId) {
      setActiveTalkId(chatTalkId);
      setActiveSegment('chat');
    }
  }, [chatTalkId]);

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

  const handleSelectTalk = useCallback((talkId: string) => {
    setActiveTalkId(talkId);
    setActiveSegment('chat');
  }, []);

  const handleEditInChat = useCallback((noteId: string) => {
    setPendingLinkNoteId(noteId);
    setActiveSegment('chat');
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBar title={assistant.firstName} />

      {weiterlesen && (
        <TouchableOpacity
          style={[styles.weiterlesen, { backgroundColor: colors.primaryContainer }]}
          onPress={() => navigateToRead({
            sourceId: weiterlesen.sourceId,
            segmentIndex: weiterlesen.segmentIndex,
            paragraphId: weiterlesen.paragraphId,
          })}
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
          />
        )}
        {activeSegment === 'gespraeche' && <GespraecheTab onSelectTalk={handleSelectTalk} />}
        {activeSegment === 'arbeitstexte' && <ArbeitstexteScreen onEditInChat={handleEditInChat} />}
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
