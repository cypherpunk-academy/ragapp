import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme, Alert } from 'react-native';
import { router } from 'expo-router';
import AppBar from '@/shared/components/AppBar';
import AppIcon from '@/shared/components/AppIcon';
import { ICONS, ICON_SIZES, lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { assistant } from '@/shared/lib/assistant';
import { useReading } from '@/shared/contexts/ReadingContext';
import { useAuth } from '@/shared/hooks/useAuth';
import { BookmarkRepository } from '@/data/repositories/BookmarkRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { continueReadingLabel } from '@/features/overview/sourceDetail';
import ChatTab from './ChatTab';
import GespraecheTab from './GespraecheTab';
import ArbeitstextTab from './ArbeitstextTab';
import type Note from '@/data/db/models/Note';

type FiloSegment = 'chat' | 'arbeitstext' | 'gespraeche';

const SEGMENTS: { id: FiloSegment; label: string; icon?: string }[] = [
  { id: 'chat', label: 'CHAT' },
  { id: 'arbeitstext', label: 'ARBEITSTEXT', icon: 'attach-file' },
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
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const {
    chatTalkId, consumeChatTalkId, chatPendingLinkNoteId, consumeChatPendingLink,
    chatPendingParagraphId, consumeChatPendingParagraph, navigateToRead,
  } = useReading();

  const [activeSegment, setActiveSegment] = useState<FiloSegment>('chat');
  const [activeTalkId, setActiveTalkId] = useState<string | null>(null);
  const [linkedNote, setLinkedNote] = useState<Note | null>(null);
  const [createNoteRequest, setCreateNoteRequest] = useState(false);
  const [weiterlesen, setWeiterlesen] = useState<WeiterlesenState | null>(null);
  const [weiterlesenDismissed, setWeiterlesenDismissed] = useState(false);
  const [pendingLinkNoteId, setPendingLinkNoteId] = useState<string | null>(null);
  const [pendingParagraphId, setPendingParagraphId] = useState<string | null>(null);
  const [activeContextParagraphId, setActiveContextParagraphId] = useState<string | null>(null);

  const showWeiterlesen = offerWeiterlesenOnLaunch
    && isFiloTabActive
    && weiterlesen != null
    && !weiterlesenDismissed;

  // Aus dem ReadingContext vorgeladenes Gespräch übernehmen (z. B. aus Suche/Lesen).
  useEffect(() => {
    if (chatTalkId) {
      setActiveTalkId(chatTalkId);
      setActiveSegment('chat');
      consumeChatTalkId();
    }
  }, [chatTalkId, consumeChatTalkId]);

  // Vorgemerkte Note zum Verknüpfen übernehmen (z. B. „Mit Philo bearbeiten" von Absatz/Kapitel/Buch).
  // Erzwingt ein neues Gespräch statt Anhängen ans aktive (aktive Gespräche haben ggf. bereits
  // einen anderen Kontext/Arbeitstext).
  useEffect(() => {
    if (chatPendingLinkNoteId) {
      setActiveTalkId(null);
      setPendingLinkNoteId(chatPendingLinkNoteId);
      setActiveSegment('chat');
      consumeChatPendingLink();
    }
  }, [chatPendingLinkNoteId, consumeChatPendingLink]);

  // Vorgemerkter Absatz zur Verankerung eines neuen Gesprächs (z. B. „Philo fragen").
  // Erzwingt ein neues Gespräch — bestehendes Gespräch hat bereits einen anderen Kontext.
  useEffect(() => {
    if (chatPendingParagraphId) {
      setActiveTalkId(null);
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

  const handleSegmentPress = useCallback((id: FiloSegment) => {
    if (id === 'arbeitstext' && !linkedNote && activeTalkId) {
      Alert.alert(
        'Arbeitstext anlegen',
        'Willst du einen Arbeitstext zu dem aktuellen Chat anlegen?',
        [
          { text: 'Nicht jetzt', style: 'cancel' },
          { text: 'Anlegen', onPress: () => setCreateNoteRequest(true) },
        ],
      );
      return;
    }
    setActiveSegment(id);
  }, [linkedNote, activeTalkId]);

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

      {(authLoading || isAuthenticated) && <View style={[styles.segmented, { borderBottomColor: colors.outlineVariant }]}>
        {SEGMENTS.map((seg) => {
          const isActive = seg.id === activeSegment;
          return (
            <TouchableOpacity
              key={seg.id}
              style={[styles.segment, isActive && { borderBottomColor: colors.primary }]}
              onPress={() => handleSegmentPress(seg.id)}
              activeOpacity={0.7}
            >
              <View style={styles.segmentLabel}>
                <Text style={[typography.labelMedium, { color: isActive ? colors.primary : colors.onSurfaceVariant }]}>
                  {seg.label}
                </Text>
                {seg.icon && (
                  <AppIcon
                    name={seg.icon as any}
                    size={14}
                    color={isActive ? colors.primary : colors.onSurfaceVariant}
                  />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>}

      {!authLoading && !isAuthenticated ? (
        <View style={styles.loginGate}>
          <AppIcon name={ICONS.account.avatar} size={48} color={colors.onSurfaceVariant} />
          <Text style={[typography.titleMedium, styles.loginGateTitle, { color: colors.onSurface }]}>
            Anmeldung erforderlich
          </Text>
          <Text style={[typography.bodyMedium, styles.loginGateBody, { color: colors.onSurfaceVariant }]}>
            Für den Chat mit Philo musst du angemeldet sein und über Credits verfügen.
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/auth/login')}
            activeOpacity={0.85}
          >
            <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>Anmelden</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.content}>
          {activeSegment === 'chat' && (
            <ChatTab
              userId={user?.id ?? ''}
              activeTalkId={activeTalkId}
              onActiveTalkChange={setActiveTalkId}
              linkNoteId={pendingLinkNoteId}
              onLinkNoteConsumed={() => setPendingLinkNoteId(null)}
              pendingParagraphId={pendingParagraphId}
              onParagraphConsumed={() => setPendingParagraphId(null)}
              onContextParagraphChange={setActiveContextParagraphId}
              onLinkedNoteChange={setLinkedNote}
              onSwitchToArbeitstext={() => setActiveSegment('arbeitstext')}
              createNoteRequest={createNoteRequest}
              onCreateNoteRequestConsumed={() => setCreateNoteRequest(false)}
            />
          )}
          {activeSegment === 'arbeitstext' && (
            <ArbeitstextTab
              userId={user?.id ?? ''}
              note={linkedNote}
              activeTalkId={activeTalkId}
              onDeleted={() => setLinkedNote(null)}
            />
          )}
          {activeSegment === 'gespraeche' && (
            <GespraecheTab
              onSelectTalk={handleSelectTalk}
              contextParagraphId={activeContextParagraphId}
            />
          )}
        </View>
      )}
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
  segmentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  content: { flex: 1 },
  loginGate: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.m,
  },
  loginGateTitle: {
    textAlign: 'center',
    marginTop: spacing.s,
  },
  loginGateBody: {
    textAlign: 'center',
    maxWidth: 320,
  },
  loginBtn: {
    marginTop: spacing.s,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: 24,
  },
});
