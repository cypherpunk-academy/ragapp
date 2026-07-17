import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, useColorScheme, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, textStyles, typography, ICONS, ICON_SIZES, getNoteBadgeStyle } from '@/shared/theme';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { ReferenceRepository } from '@/data/repositories/ReferenceRepository';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { ragrunApi } from '@/data/services/ragrunApi';
import AppIcon from '@/shared/components/AppIcon';
import DocumentPreviewOverlay from '@/shared/components/DocumentPreviewOverlay';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import RagInsightsOverlay from '@/shared/components/RagInsightsOverlay';
import AssistantMessageText from '@/shared/components/AssistantMessageText';
import TurnMetaLine from '@/shared/components/TurnMetaLine';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import { firstWords } from '@/shared/lib/arbeitstextContext';
import { resolveRagHitsForTurn, citationIndexToListIndex } from '@/shared/lib/ragHits';
import { countUniqueCitations } from '@/shared/lib/citationMarkers';
import type Turn from '@/data/db/models/Turn';
import type Note from '@/data/db/models/Note';
import type Reference from '@/data/db/models/Reference';

const LOCAL_USER = 'local';

const PERSONALITY_LABELS: Record<string, string> = {
  sokrates: 'Sokrates',
  socrates: 'Sokrates',
  'der-machtarchitekt': 'Der Machtarchitekt',
  'assistant-host': 'Philo',
  'assistant-host-deep': 'Assistant Host Deep',
};

function personalityLabel(slug: string | null | undefined): string {
  if (!slug) return 'KI';
  return PERSONALITY_LABELS[slug] ?? slug;
}

type Props = {
  activeTalkId: string | null;
  onActiveTalkChange: (talkId: string) => void;
  /** Arbeitstext, der beim Öffnen dieses Tabs verknüpft werden soll (z. B. „In Gespräch bearbeiten“). */
  linkNoteId?: string | null;
  onLinkNoteConsumed?: () => void;
  /** Absatz, mit dem ein neu gestartetes Gespräch verankert werden soll (z. B. „Philo zu diesem Absatz fragen“). */
  pendingParagraphId?: string | null;
  onParagraphConsumed?: () => void;
};

/** CHAT-Segment des Filo-Tabs: aktives Gespräch oder Leerzustand mit Eingabefeld. */
export default function ChatTab({
  activeTalkId, onActiveTalkChange, linkNoteId, onLinkNoteConsumed,
  pendingParagraphId, onParagraphConsumed,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const badgeStyle = getNoteBadgeStyle(isDark);
  const insets = useSafeAreaInsets();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [copying, setCopying] = useState(false);
  const [observedLinkedNote, setObservedLinkedNote] = useState<Note | null>(null);
  const [pendingAttachNote, setPendingAttachNote] = useState<Note | null>(null);
  const [talkParagraphId, setTalkParagraphId] = useState<string | null>(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [referencesByTurnId, setReferencesByTurnId] = useState<Record<string, Reference[]>>({});
  const [insightsState, setInsightsState] = useState<{
    turn: Turn;
    scrollToIndex?: number;
  } | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState('');
  const [streamingStatus, setStreamingStatus] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const openInsights = useCallback((turn: Turn, citationIndex?: number) => {
    const refs = referencesByTurnId[turn.id] ?? [];
    const hits = resolveRagHitsForTurn(turn, refs);
    const scrollToIndex = citationIndex != null
      ? citationIndexToListIndex(citationIndex, hits)
      : undefined;
    setInsightsState({ turn, scrollToIndex });
  }, [referencesByTurnId]);

  // Arbeitstext-Verknüpfung des aktiven Gesprächs (Filo §6, max. 1 Dokument) — DB-backed, reaktiv.
  useEffect(() => {
    if (!activeTalkId) {
      setObservedLinkedNote(null);
      return;
    }
    const sub = NoteRepository.observeByTalk(activeTalkId).subscribe((notes) => {
      setObservedLinkedNote(notes[0] ?? null);
    });
    return () => sub.unsubscribe();
  }, [activeTalkId]);

  const linkedNote = activeTalkId ? observedLinkedNote : pendingAttachNote;

  // „Mit Philo bearbeiten“ aus Absatz/Kapitel/Buch: Arbeitstext verknüpfen — sofort, falls
  // ein Gespräch aktiv ist, sonst als pending vormerken (Persistenz erst beim ersten Senden).
  useEffect(() => {
    if (!linkNoteId) return;
    let cancelled = false;
    void NoteRepository.findById(linkNoteId).then(async (note) => {
      if (cancelled || !note) { onLinkNoteConsumed?.(); return; }
      if (activeTalkId) {
        await NoteRepository.attachToTalk(note, activeTalkId);
      } else {
        setPendingAttachNote(note);
      }
      onLinkNoteConsumed?.();
    });
    return () => { cancelled = true; };
  }, [linkNoteId, activeTalkId, onLinkNoteConsumed]);

  // „Philo zu diesem Absatz fragen“: Absatz vormerken, um das nächste neue Gespräch zu verankern
  // (nur relevant ohne aktives Gespräch — ein bestehendes Gespräch hat bereits seinen Kontext).
  useEffect(() => {
    if (!pendingParagraphId) return;
    if (!activeTalkId) setTalkParagraphId(pendingParagraphId);
    onParagraphConsumed?.();
  }, [pendingParagraphId, activeTalkId, onParagraphConsumed]);

  useEffect(() => {
    if (!activeTalkId) {
      setTurns([]);
      return;
    }

    let cancelled = false;

    const sub = TurnRepository.observeByTalk(activeTalkId).subscribe((list) => {
      if (!cancelled) setTurns(list);
    });

    return () => {
      cancelled = true;
      sub.unsubscribe();
    };
  }, [activeTalkId]);

  useEffect(() => {
    if (turns.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [turns.length]);

  useEffect(() => {
    if (pendingUserMessage) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [pendingUserMessage, streamingText]);

  // RAG-Referenzen pro Turn (Sync → WDB `references`; Fallback wenn kein chunk_index_map).
  useEffect(() => {
    if (turns.length === 0) {
      setReferencesByTurnId({});
      return;
    }
    let cancelled = false;
    const turnIds = turns.map((t) => t.id);
    void ReferenceRepository.findByTurnIds(turnIds).then((refs) => {
      if (cancelled) return;
      const grouped: Record<string, Reference[]> = {};
      for (const ref of refs) {
        const list = grouped[ref.turnId] ?? [];
        list.push(ref);
        grouped[ref.turnId] = list;
      }
      setReferencesByTurnId(grouped);
    });
    return () => { cancelled = true; };
  }, [turns]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);
    setPendingUserMessage(text);
    setStreamingText('');
    setStreamingStatus(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulated = '';

    try {
      for await (const event of ragrunApi.streamChat(
        {
          message: text,
          personality: 'assistant-host',
          talk_id: activeTalkId ?? undefined,
          mode: 'chat',
        },
        { signal: controller.signal },
      )) {
        if (event.type === 'status') {
          setStreamingStatus(event.label);
        } else if (event.type === 'token') {
          accumulated += event.content;
          setStreamingText(accumulated);
        } else if (event.type === 'error') {
          throw new Error(event.message);
        } else if (event.type === 'done') {
          const isNewTalk = !activeTalkId;
          if (isNewTalk) {
            await TalkRepository.create({
              id: event.talk_id,
              userId: LOCAL_USER,
              title: text.slice(0, 60),
              kontextParagraphId: talkParagraphId ?? undefined,
            });
            setTalkParagraphId(null);
            if (pendingAttachNote) {
              await NoteRepository.attachToTalk(pendingAttachNote, event.talk_id);
              setPendingAttachNote(null);
            }
            onActiveTalkChange(event.talk_id);
          }
          const chunkIndexMap = event.citations.length
            ? event.citations.map((c, idx) => ({
                index: c.index ?? idx + 1,
                chunk_id: c.chunk_id,
                text: c.text,
                source_title: c.source_title,
                segment_title: c.segment_title,
                source_id: c.source_id,
                chunk_type: c.chunk_type,
                source_type: c.source_type,
                author: c.author,
                book_title: c.book_title,
                paragraph_id: c.paragraph_id,
                segment_index: c.segment_index,
                score: c.score,
              }))
            : null;
          await TurnRepository.create({
            id: event.turn_id,
            talkId: event.talk_id,
            turnIndex: isNewTalk ? 0 : turns.length,
            userMessage: text,
            personality: 'assistant-host',
            assistantMessage: event.assistant_message,
            chunkIndexMap,
            usage: event.usage,
          });
        }
      }
    } catch {
      if (controller.signal.aborted) {
        // Abbruch: kein Server-Turn wurde erzeugt — Teilantwort lokal-only persistieren.
        try {
          const isNewTalk = !activeTalkId;
          let talkId = activeTalkId;
          if (isNewTalk) {
            const newTalk = await TalkRepository.create({
              userId: LOCAL_USER,
              title: text.slice(0, 60),
              kontextParagraphId: talkParagraphId ?? undefined,
            });
            talkId = newTalk.id;
            setTalkParagraphId(null);
            if (pendingAttachNote) {
              await NoteRepository.attachToTalk(pendingAttachNote, talkId);
              setPendingAttachNote(null);
            }
            onActiveTalkChange(talkId);
          }
          await TurnRepository.create({
            talkId: talkId!,
            turnIndex: isNewTalk ? 0 : turns.length,
            userMessage: text,
            personality: 'assistant-host',
            assistantMessage: accumulated || undefined,
          });
        } catch {
          Alert.alert('Fehler', 'Antwort konnte nicht gespeichert werden.');
        }
      } else {
        Alert.alert('Fehler', 'Nachricht konnte nicht gesendet werden.');
        setInputText(text);
      }
    } finally {
      abortControllerRef.current = null;
      setSending(false);
      setPendingUserMessage(null);
      setStreamingText('');
      setStreamingStatus(null);
    }
  }, [inputText, activeTalkId, sending, turns.length, onActiveTalkChange, pendingAttachNote, talkParagraphId]);

  const handleKopieren = useCallback(async () => {
    if (!activeTalkId) return;
    setCopying(true);
    try {
      const newTalk = await TalkRepository.copyTalk(activeTalkId);
      onActiveTalkChange(newTalk.id);
    } catch {
      Alert.alert('Fehler', 'Gespräch konnte nicht kopiert werden.');
    } finally {
      setCopying(false);
    }
  }, [activeTalkId, onActiveTalkChange]);

  const handleSchnittHier = useCallback(async (maxTurnIndex: number) => {
    if (!activeTalkId) return;
    setCopying(true);
    try {
      const newTalk = await TalkRepository.copyTalk(activeTalkId, { maxTurnIndex });
      onActiveTalkChange(newTalk.id);
    } catch {
      Alert.alert('Fehler', 'Konnte nicht schneiden.');
    } finally {
      setCopying(false);
    }
  }, [activeTalkId, onActiveTalkChange]);

  const handleDetachDocument = useCallback(async () => {
    if (linkedNote) await NoteRepository.attachToTalk(linkedNote, null);
    setPendingAttachNote(null);
    setPreviewVisible(false);
  }, [linkedNote]);

  const handleAttachPress = useCallback(() => {
    if (linkedNote) {
      setPreviewVisible(true);
      return;
    }
    setCreatingNote(true);
  }, [linkedNote]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      {(activeTalkId || linkedNote) ? (
        <View style={[styles.talkHeader, { borderBottomColor: colors.outlineVariant }]}>
          {linkedNote ? (
            <TouchableOpacity onPress={handleAttachPress} style={styles.talkTitle} activeOpacity={0.8}>
              <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
                <Text style={[textStyles.noteMeta, { color: badgeStyle.textColor }]} numberOfLines={1}>
                  {`Arbeitstext: ${firstWords(extractDocumentTitle(linkedNote.content))}`}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.talkTitle} />
          )}
          {activeTalkId && (
            <>
              <TouchableOpacity onPress={handleAttachPress} hitSlop={8}>
                <AppIcon
                  name={ICONS.arbeitstext.attach}
                  size={ICON_SIZES.menu}
                  color={linkedNote ? colors.primary : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleKopieren} disabled={copying} hitSlop={8}>
                <Ionicons name="copy-outline" size={20} color={copying ? colors.onSurfaceVariant : colors.primary} />
              </TouchableOpacity>
            </>
          )}
        </View>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={turns}
        keyExtractor={(t) => `${t.talkId}-${t.turnIndex}`}
        contentContainerStyle={styles.turnListContent}
        renderItem={({ item: turn }) => {
          const refs = referencesByTurnId[turn.id] ?? [];
          const ragHits = resolveRagHitsForTurn(turn, refs);
          const citedInText = turn.assistantMessage
            ? countUniqueCitations(turn.assistantMessage)
            : 0;
          const ragHitCount = citedInText > 0 ? citedInText : ragHits.length;
          const showRagMeta = Boolean(turn.assistantMessage?.trim()) && ragHitCount > 0;

          return (
          <View style={styles.turnBlock}>
            <View style={[styles.bubble, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
                {turn.userMessage}
              </Text>
            </View>
            <TurnMetaLine turn={turn} kind="user" />

            {turn.assistantMessage ? (
              <>
                <View style={[styles.bubble, { backgroundColor: colors.secondaryContainer }]}>
                  <AssistantMessageText
                    text={turn.assistantMessage}
                    onCitationPress={(idx) => openInsights(turn, idx)}
                  />
                </View>
                <TurnMetaLine
                  turn={turn}
                  kind="assistant"
                  personalityLabel={personalityLabel(turn.personality)}
                  ragHitCount={showRagMeta ? ragHitCount : 0}
                  onRagHitsPress={showRagMeta ? () => openInsights(turn) : undefined}
                />
              </>
            ) : (
              <View style={[styles.bubble, { backgroundColor: colors.secondaryContainer }]}>
                <ActivityIndicator size="small" color={colors.onSecondaryContainer} />
              </View>
            )}
            <TouchableOpacity
              onPress={() => handleSchnittHier(turn.turnIndex)}
              style={styles.schnittBtn}
              hitSlop={6}
            >
              <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
                Schnitt hier
              </Text>
            </TouchableOpacity>
          </View>
          );
        }}
        ListEmptyComponent={
          pendingUserMessage ? null : (
            <View style={styles.center}>
              <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                Noch keine Nachrichten. Stelle eine Frage!
              </Text>
            </View>
          )
        }
        ListFooterComponent={
          pendingUserMessage ? (
            <View style={styles.turnBlock}>
              <View style={[styles.bubble, { backgroundColor: colors.surfaceContainerLow }]}>
                <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
                  {pendingUserMessage}
                </Text>
              </View>
              <View style={[styles.bubble, { backgroundColor: colors.secondaryContainer }]}>
                {streamingText ? (
                  <AssistantMessageText text={streamingText} />
                ) : (
                  <View style={styles.streamingStatusRow}>
                    <ActivityIndicator size="small" color={colors.onSecondaryContainer} />
                    {streamingStatus ? (
                      <Text style={[textStyles.noteMeta, { color: colors.onSecondaryContainer }]}>
                        {streamingStatus}
                      </Text>
                    ) : null}
                  </View>
                )}
              </View>
            </View>
          ) : null
        }
      />

      {/* Eingabe */}
      <View style={[styles.inputRow, { borderTopColor: colors.outlineVariant, paddingBottom: insets.bottom || spacing.m }]}>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Deine Frage…"
          placeholderTextColor={colors.onSurfaceVariant}
          multiline
          style={[
            typography.bodyMedium,
            styles.textInput,
            { color: colors.onSurface, backgroundColor: colors.surfaceContainerHigh },
          ]}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={sending ? handleStop : handleSend}
          disabled={!sending && !inputText.trim()}
          style={[styles.sendBtn, { backgroundColor: sending || inputText.trim() ? colors.primary : colors.surfaceContainerHigh }]}
          activeOpacity={0.8}
        >
          {sending ? (
            <Ionicons name="stop" size={18} color={colors.onPrimary} />
          ) : (
            <Ionicons name="arrow-up" size={20} color={inputText.trim() ? colors.onPrimary : colors.onSurfaceVariant} />
          )}
        </TouchableOpacity>
      </View>

      {activeTalkId && creatingNote && (
        <NoteEditorModal
          visible
          onClose={() => setCreatingNote(false)}
          talkId={activeTalkId}
          initialContent="# Arbeitstext aus dem Gespräch mit Philo\n\n"
          contextLabel="Neuer Arbeitstext"
        />
      )}
      {previewVisible && (
        <DocumentPreviewOverlay
          note={linkedNote}
          onClose={() => setPreviewVisible(false)}
          onDetach={() => void handleDetachDocument()}
          onDeleted={() => { if (!activeTalkId) setPendingAttachNote(null); }}
        />
      )}
      <RagInsightsOverlay
        visible={insightsState != null}
        turn={insightsState?.turn ?? null}
        hits={
          insightsState
            ? resolveRagHitsForTurn(
              insightsState.turn,
              referencesByTurnId[insightsState.turn.id] ?? [],
            )
            : []
        }
        scrollToIndex={insightsState?.scrollToIndex}
        onClose={() => setInsightsState(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  talkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  talkTitle: { flex: 1 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 6,
  },
  turnListContent: { padding: spacing.m, gap: spacing.l, flexGrow: 1 },
  turnBlock: { gap: spacing.s },
  bubble: { borderRadius: 12, padding: spacing.m },
  streamingStatusRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  schnittBtn: { alignSelf: 'flex-end', paddingHorizontal: spacing.xs, paddingVertical: 2 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  textInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    maxHeight: 120,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
