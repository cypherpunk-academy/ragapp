import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import { useReading, type ContributionsTab } from '@/shared/contexts/ReadingContext';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { ReferenceRepository } from '@/data/repositories/ReferenceRepository';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { confirmDeleteNote } from '@/shared/lib/confirmDeleteNote';
import type Note from '@/data/db/models/Note';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';
import type Reference from '@/data/db/models/Reference';
import type Paragraph from '@/data/db/models/Paragraph';
import { paragraphAnchorLabel } from '@/shared/lib/paragraphAnchorLabel';
import { getTalkAnchorTurnIndex } from '@/shared/lib/talkAnchor';

export type { ContributionsTab };

const TABS: { id: ContributionsTab; label: string }[] = [
  { id: 'notes', label: 'Notizen' },
  { id: 'conversations', label: 'Gespräche' },
  { id: 'rag', label: 'RAG-Treffer' },
];

const PERSONALITY_LABELS: Record<string, string> = {
  sokrates: 'Sokrates',
  socrates: 'Sokrates',
  'der-machtarchitekt': 'Der Machtarchitekt',
  'assistant-host': 'Assistant Host',
  'assistant-host-deep': 'Assistant Host Deep',
};

const REF_KIND_LABELS: Record<string, string> = {
  begriff: 'Begriff',
  zitat: 'Zitat',
  buch: 'Buch',
  vortrag: 'Vortrag',
};

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

function personalityLabel(slug: string | null | undefined): string {
  if (!slug) return 'KI';
  return PERSONALITY_LABELS[slug] ?? slug;
}

function refKindLabel(kind: string | null | undefined): string {
  if (!kind) return 'Treffer';
  return REF_KIND_LABELS[kind] ?? kind;
}

export default function ContributionsScreen({
  visible, onClose, paragraph, sourceId, initialTab = 'notes',
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { navigateToRead, openConversationDetail } = useReading();
  const [activeTab, setActiveTab] = useState<ContributionsTab>(initialTab);
  const [notes, setNotes] = useState<Note[]>([]);
  const [talks, setTalks] = useState<TalkWithTurn[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (visible) setActiveTab(initialTab);
  }, [visible, initialTab]);

  useEffect(() => {
    if (!paragraph || !visible) {
      setNotes([]);
      setTalks([]);
      setReferences([]);
      return;
    }
    let cancelled = false;

    const loadTalks = async (talkList: Talk[]) => {
      const withTurns: TalkWithTurn[] = [];
      for (const talk of talkList) {
        const anchorIndex = getTalkAnchorTurnIndex(talk);
        const snippetTurn = await TurnRepository.findByTalkAndIndex(talk.talkId, anchorIndex);
        withTurns.push({ talk, snippetTurn });
      }
      return withTurns;
    };

    const refresh = async () => {
      const [noteList, talkList, refList] = await Promise.all([
        NoteRepository.findByParagraph(paragraph.paragraphId),
        TalkRepository.findByParagraph(paragraph.paragraphId),
        ReferenceRepository.findByParagraph(paragraph.paragraphId),
      ]);
      if (cancelled) return;
      setNotes(noteList);
      setReferences(refList);
      setTalks(await loadTalks(talkList));
    };

    void refresh();

    const noteSub = NoteRepository.observeBySource(sourceId).subscribe(() => { void refresh(); });
    const talkSub = TalkRepository.observeByParagraph(paragraph.paragraphId).subscribe(() => { void refresh(); });
    const refSub = ReferenceRepository.observeByParagraph(paragraph.paragraphId).subscribe(() => { void refresh(); });

    return () => {
      cancelled = true;
      noteSub.unsubscribe();
      talkSub.unsubscribe();
      refSub.unsubscribe();
    };
  }, [paragraph, sourceId, visible]);

  const contextLabel = useMemo(() => {
    if (!paragraph) return null;
    const typeLabel = paragraph.segmentType === 'preface' ? 'Vorwort' : 'Kapitel';
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
          style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, paddingHorizontal: spacing.m, paddingTop: spacing.s }]}
          numberOfLines={2}
        >
          {contextLabel}
        </Text>
      )}

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
              <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.l }]}>
                Noch keine Notizen zu diesem Absatz.
              </Text>
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
              <TouchableOpacity
                key={talk.id}
                activeOpacity={0.85}
                onPress={() => openConversationDetail(
                  talk.talkId,
                  paragraph.paragraphId,
                  getTalkAnchorTurnIndex(talk),
                )}
                style={[styles.noteCard, { backgroundColor: colors.surfaceContainer }]}
              >
                <View style={styles.noteCardHeader}>
                  <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
                    {formatDate(talk.updatedAt)} · {personalityLabel(snippetTurn?.assistantPersonality)}
                  </Text>
                </View>
                {talk.title ? (
                  <Text style={[textStyles.chapterTitle, { color: colors.onBackground, textAlign: 'left' }]}>
                    {talk.title.toUpperCase()}
                  </Text>
                ) : null}
                {snippetTurn ? (
                  <Text style={[textStyles.conversationSnippet, { color: colors.onSurface }]} numberOfLines={3}>
                    {snippetTurn.userMessage}
                  </Text>
                ) : null}
                {talk.summary ? (
                  <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
                    {talk.summary}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </>
        )}

        {activeTab === 'rag' && (
          <>
            {references.length === 0 && (
              <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.l }]}>
                Noch keine RAG-Treffer zu diesem Absatz.
              </Text>
            )}
            {references.map((ref) => (
              <View key={ref.id} style={[styles.noteCard, { backgroundColor: colors.surfaceContainer }]}>
                <View style={styles.ragCardHeader}>
                  <Text style={[textStyles.contributionsTab, { color: colors.primary }]}>
                    [{ref.refIndex}]
                  </Text>
                  <View style={[styles.ragBadge, { backgroundColor: colors.primaryContainer }]}>
                    <Text style={[textStyles.noteMeta, { color: colors.onPrimaryContainer }]}>
                      {refKindLabel(ref.refKind)}
                    </Text>
                  </View>
                </View>
                <Text style={[textStyles.chapterTitle, { color: colors.onBackground, textAlign: 'left' }]}>
                  {ref.sourceTitle}
                </Text>
                {ref.segmentTitle ? (
                  <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
                    {ref.segmentTitle}
                    {ref.relevance != null ? ` · ${Math.round(ref.relevance * 100)} %` : ''}
                  </Text>
                ) : null}
                {ref.snippet ? (
                  <Text style={[textStyles.noteBody, { color: colors.onSurface }]} numberOfLines={3}>
                    {ref.snippet}
                  </Text>
                ) : null}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <NoteEditorModal
        visible={editorOpen}
        onClose={() => { setEditorOpen(false); setEditNote(null); }}
        note={editNote}
        contextLabel={contextLabel}
        onDeleted={() => { setEditorOpen(false); setEditNote(null); }}
      />
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
  ragCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  ragBadge: { paddingHorizontal: spacing.s, paddingVertical: 2, borderRadius: 6 },
});
