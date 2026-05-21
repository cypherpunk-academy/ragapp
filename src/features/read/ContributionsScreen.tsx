import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import { useReading, type ContributionsTab } from '@/shared/contexts/ReadingContext';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';

import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { confirmDeleteNote } from '@/shared/lib/confirmDeleteNote';
import type Note from '@/data/db/models/Note';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';
import type Paragraph from '@/data/db/models/Paragraph';
import { paragraphAnchorLabel } from '@/shared/lib/paragraphAnchorLabel';
import { getTalkAnchorTurnIndex } from '@/shared/lib/talkAnchor';
import TalkCard from '@/shared/components/TalkCard';
import { useAuth } from '@/shared/hooks/useAuth';

export type { ContributionsTab };

const TABS: { id: ContributionsTab; label: string }[] = [
  { id: 'notes', label: 'Notizen' },
  { id: 'conversations', label: 'Gespräche' },
];



type TalkWithTurn = { talk: Talk; snippetTurn: Turn | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  paragraph: Paragraph | null;
  sourceId: string;
  initialTab?: ContributionsTab;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}


export default function ContributionsScreen({
  visible, onClose, paragraph, sourceId, initialTab = 'notes',
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { loading: authLoading, isAuthenticated, isConfigured } = useAuth();
  const { navigateToRead, openConversationDetail } = useReading();
  const [activeTab, setActiveTab] = useState<ContributionsTab>(initialTab);
  const [notes, setNotes] = useState<Note[]>([]);
  const [talks, setTalks] = useState<TalkWithTurn[]>([]);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (visible) setActiveTab(initialTab);
  }, [visible, initialTab]);

  useEffect(() => {
    if (!paragraph || !visible || !isAuthenticated) {
      setNotes([]);
      setTalks([]);
      return;
    }
    let cancelled = false;

    const loadTalks = async (talkList: Talk[]) => {
      const withTurns: TalkWithTurn[] = [];
      for (const talk of talkList) {
        const anchorIndex = getTalkAnchorTurnIndex(talk);
        const snippetTurn = await TurnRepository.findByTalkAndIndex(talk.id, anchorIndex);
        withTurns.push({ talk, snippetTurn });
      }
      return withTurns;
    };

    const refresh = async () => {
      const [noteList, talkList] = await Promise.all([
        NoteRepository.findByParagraph(paragraph.paragraphId),
        TalkRepository.findByParagraph(paragraph.paragraphId),
      ]);
      if (cancelled) return;
      setNotes(noteList);
      setTalks(await loadTalks(talkList));
    };

    void refresh();

    const noteSub = NoteRepository.observeBySource(sourceId).subscribe(() => { void refresh(); });
    const talkSub = TalkRepository.observeByParagraph(paragraph.paragraphId).subscribe(() => { void refresh(); });

    return () => {
      cancelled = true;
      noteSub.unsubscribe();
      talkSub.unsubscribe();
    };
  }, [paragraph, sourceId, visible, isAuthenticated]);

  const contextLabel = useMemo(() => {
    if (!paragraph) return null;
    const typeLabel = 'Kapitel';
    return `${typeLabel} · ${paragraph.segmentTitle} · ¶${paragraph.paragraphNumber}`;
  }, [paragraph]);

  const anchorLabel = useMemo(
    () => (paragraph ? paragraphAnchorLabel(paragraph) : null),
    [paragraph],
  );

  /** Lange Notizen: Karteninhalt scrollbar statt unbegrenzt hoch. */
  const notePreviewMaxHeight = Math.round(windowHeight * 0.38);

  const handleOpenInReader = useCallback(() => {
    if (!paragraph) return;
    onClose();
    navigateToRead({
      sourceId,
      segmentIndex: paragraph.segmentIndex,
      paragraphId: paragraph.paragraphId,
    });
  }, [paragraph, sourceId, onClose, navigateToRead]);

  const handleCreateNote = useCallback(() => {
    setEditNote(null);
    setEditorOpen(true);
  }, []);

  const handleEdit = (note: Note) => {
    setEditNote(note);
    setEditorOpen(true);
  };

  const handleDelete = (note: Note) => {
    confirmDeleteNote(() => {
      void NoteRepository.delete(note);
    });
  };

  if (!visible || !paragraph) return null;

  return (
    <View style={[overlayStyles.fullscreen, styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.appBar, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[textStyles.contributionsTitle, { color: colors.onBackground, flex: 1 }]} numberOfLines={1}>
          Beiträge
        </Text>
      </View>

      {contextLabel && (
        <Text
          style={[
            textStyles.contributionsBreadcrumb,
            {
              color: colors.onSurfaceVariant,
              paddingHorizontal: spacing.m,
              paddingTop: spacing.s,
              paddingBottom: spacing.l,
            },
          ]}
          numberOfLines={2}
        >
          {contextLabel}
        </Text>
      )}

      {authLoading && (
        <View style={styles.authLoading}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}

      {!authLoading && !isAuthenticated && (
        <View style={[styles.scroll, styles.content]}>
          <View style={[styles.authGateCard, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface, textAlign: 'center' }]}>
              Notizen und Gespräche zu diesem Absatz sind nur mit einem Konto sichtbar und bearbeitbar.
            </Text>
            {!isConfigured ? (
              <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.s }]}>
                In dieser Installation ist noch kein Anmeldeserver hinterlegt (Supabase-URL und -Schlüssel).
              </Text>
            ) : null}
            <TouchableOpacity
              style={[styles.authCta, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/auth/login')}
              activeOpacity={0.85}
            >
              <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Anmelden</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!authLoading && isAuthenticated && (
        <>
          <View style={[styles.tabRow, { borderBottomColor: colors.outlineVariant }]}>
            {TABS.map((tab) => {
              const active = tab.id === activeTab;
              return (
                <TouchableOpacity
                  key={tab.id}
                  style={styles.tab}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[textStyles.contributionsTab, { color: active ? colors.primary : colors.onSurfaceVariant }]}>
                    {tab.label}
                  </Text>
                  {active && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
            {activeTab === 'notes' && (
              <>
                {notes.length === 0 && (
                  <View style={styles.emptyNotes}>
                    <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                      Noch keine Notizen zu diesem Absatz.
                    </Text>
                    <TouchableOpacity
                      style={[styles.createNoteBtn, { backgroundColor: colors.primary }]}
                      onPress={handleCreateNote}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="pencil-outline" size={20} color={colors.onPrimary} />
                      <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Notiz erstellen</Text>
                    </TouchableOpacity>
                  </View>
                )}
                {notes.map((note) => (
                  <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.surfaceContainer }]}>
                    <View style={styles.noteCardHeader}>
                      <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
                        {formatDate(note.createdAt)} · ICH
                      </Text>
                      <View style={styles.noteActions}>
                        <TouchableOpacity onPress={() => handleEdit(note)} hitSlop={8}>
                          <Ionicons name="pencil" size={18} color={colors.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDelete(note)} hitSlop={8}>
                          <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
                        </TouchableOpacity>
                      </View>
                    </View>
                    {anchorLabel ? (
                      <View style={[styles.noteCardAnchor, { borderBottomColor: colors.outlineVariant }]}>
                        <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, textTransform: 'none' }]}>
                          {anchorLabel}
                        </Text>
                      </View>
                    ) : null}
                    <ScrollView
                      style={[styles.noteBodyScroll, { maxHeight: notePreviewMaxHeight }]}
                      nestedScrollEnabled
                      keyboardShouldPersistTaps="handled"
                      showsVerticalScrollIndicator
                    >
                      <Pressable onPress={handleOpenInReader} accessibilityRole="link">
                        <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>{note.content}</Text>
                      </Pressable>
                    </ScrollView>
                  </View>
                ))}
              </>
            )}

            {activeTab === 'conversations' && (
              <>
                {talks.length === 0 && (
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.l }]}>
                    Noch keine Gespräche zu diesem Absatz.
                  </Text>
                )}
                {talks.map(({ talk, snippetTurn }) => (
                  <TalkCard
                    key={talk.id}
                    talk={talk}
                    snippetTurn={snippetTurn}
                    onPress={() => openConversationDetail(
                      talk.id,
                      paragraph.paragraphId,
                      getTalkAnchorTurnIndex(talk),
                    )}
                  />
                ))}
              </>
            )}

          </ScrollView>

          <NoteEditorModal
            visible={editorOpen}
            onClose={() => { setEditorOpen(false); setEditNote(null); }}
            note={editNote}
            contextLabel={contextLabel}
            paragraphId={paragraph.paragraphId}
            segmentId={`${sourceId}:${paragraph.segmentIndex}`}
            sourceId={sourceId}
            onDeleted={() => { setEditorOpen(false); setEditNote(null); }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  backBtn: { padding: spacing.xs },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.s,
    gap: 4,
  },
  tabUnderline: { height: 2, width: '60%', borderRadius: 1 },
  content: { padding: spacing.m, gap: spacing.m, paddingBottom: spacing.xxl },
  noteCard: { borderRadius: 12, padding: spacing.m, gap: spacing.xs },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteCardAnchor: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: spacing.xs,
    marginBottom: spacing.xs,
  },
  noteBodyScroll: { flexGrow: 0 },
  noteActions: { flexDirection: 'row', gap: spacing.m },
  authLoading: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xxl },
  authGateCard: { borderRadius: 12, padding: spacing.l, gap: spacing.m },
  authCta: {
    marginTop: spacing.s,
    borderRadius: 999,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
    alignItems: 'center',
    alignSelf: 'center',
    minWidth: 200,
  },
  emptyNotes: {
    alignItems: 'center',
    gap: spacing.l,
    marginTop: spacing.l,
    paddingHorizontal: spacing.m,
  },
  createNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    borderRadius: 999,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.l,
  },
});
