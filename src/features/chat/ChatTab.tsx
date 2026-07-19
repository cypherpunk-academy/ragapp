import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, useColorScheme, ActivityIndicator, Alert, Modal, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { lightColors, darkColors, spacing, textStyles, typography, ICONS, ICON_SIZES, getNoteBadgeStyle } from '@/shared/theme';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { ReferenceRepository } from '@/data/repositories/ReferenceRepository';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { ragrunApi } from '@/data/services/ragrunApi';
import AppIcon from '@/shared/components/AppIcon';
import DocumentPreviewOverlay from '@/shared/components/DocumentPreviewOverlay';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import RagInsightsOverlay from '@/shared/components/RagInsightsOverlay';
import AssistantMessageText from '@/shared/components/AssistantMessageText';
import InlineMdText from '@/shared/components/InlineMdText';
import TurnMetaLine from '@/shared/components/TurnMetaLine';
import { extractDocumentTitle, buildDocumentOutline } from '@/data/lib/documentTree';
import { dispatchToolEffects } from '@/data/tools';
import { firstWords } from '@/shared/lib/arbeitstextContext';
import { paragraphAnchorLabel } from '@/shared/lib/paragraphAnchorLabel';
import { resolveRagHitsForTurn, citationIndexToListIndex } from '@/shared/lib/ragHits';
import { countUniqueCitations } from '@/shared/lib/citationMarkers';
import { formatTalkAsMarkdown } from '@/shared/lib/formatTalkMarkdown';
import { CHAT_MODES, chatModeLabel } from '@/shared/lib/chatModes';
import { contextLimitForModel } from '@/shared/lib/modelContextLimits';
import { computeEffectiveContextTokens } from '@/shared/lib/computeEffectiveContextTokens';
import type { ChatMode, ChatContextMeta } from '@/shared/types/ragrun';
import type Turn from '@/data/db/models/Turn';
import type Note from '@/data/db/models/Note';
import type Reference from '@/data/db/models/Reference';

const LOCAL_USER = 'local';

type ContextParagraph = {
  id: string;
  text: string;
  label: string;
};

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
  onActiveTalkChange: (talkId: string | null) => void;
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
  const [metaLinkedNote, setMetaLinkedNote] = useState<Note | null>(null);
  const [pendingAttachNote, setPendingAttachNote] = useState<Note | null>(null);
  const [contextParagraph, setContextParagraph] = useState<ContextParagraph | null>(null);
  const [creatingNote, setCreatingNote] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [lastUpdatedNote, setLastUpdatedNote] = useState<Note | null>(null);
  const [referencesByTurnId, setReferencesByTurnId] = useState<Record<string, Reference[]>>({});
  const [insightsState, setInsightsState] = useState<{
    turn: Turn;
    scrollToIndex?: number;
  } | null>(null);
  const [pinned, setPinnedState] = useState(false);
  const [mode, setModeState] = useState<ChatMode>('chat');
  const [modePickerVisible, setModePickerVisible] = useState(false);
  const [menuTurn, setMenuTurn] = useState<{ turn: Turn; part: 'user' | 'assistant' } | null>(null);
  const [compressedUpToTurnIndex, setCompressedUpToTurnIndex] = useState<number | null>(null);
  const [contextMeta, setContextMeta] = useState<ChatContextMeta | null>(null);
  const [contextSheetVisible, setContextSheetVisible] = useState(false);
  const [compressing, setCompressing] = useState(false);
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

  /** Fallback wenn `notes.talk_id` noch nicht gesetzt ist, `kontext_meta.note_id` aber schon. */
  useEffect(() => {
    if (!activeTalkId || observedLinkedNote) {
      setMetaLinkedNote(null);
      return;
    }
    let cancelled = false;
    void TalkRepository.findById(activeTalkId).then(async (talk) => {
      if (cancelled || !talk?.kontextMeta) return;
      try {
        const meta = JSON.parse(talk.kontextMeta) as { note_id?: string };
        if (!meta.note_id) return;
        const note = await NoteRepository.findById(meta.note_id);
        if (!cancelled && note) setMetaLinkedNote(note);
      } catch {
        /* invalid kontext_meta */
      }
    });
    return () => { cancelled = true; };
  }, [activeTalkId, observedLinkedNote]);

  const linkedNote = activeTalkId
    ? (observedLinkedNote ?? metaLinkedNote)
    : pendingAttachNote;

  // „Mit Philo bearbeiten“ aus Absatz/Kapitel/Buch: Arbeitstext verknüpfen — sofort, falls
  // ein Gespräch aktiv ist, sonst als pending vormerken (Persistenz erst beim ersten Senden).
  useEffect(() => {
    if (!linkNoteId) return;
    setContextParagraph(null);
    let cancelled = false;
    void NoteRepository.findById(linkNoteId).then(async (note) => {
      if (cancelled || !note) { onLinkNoteConsumed?.(); return; }
      if (activeTalkId) {
        await NoteRepository.attachToTalk(note, activeTalkId);
        await TalkRepository.setKontextMeta(activeTalkId, { note_id: note.id });
      } else {
        setPendingAttachNote(note);
      }
      onLinkNoteConsumed?.();
    });
    return () => { cancelled = true; };
  }, [linkNoteId, activeTalkId, onLinkNoteConsumed]);

  // „Philo fragen“: Absatz laden und als Gesprächs-Bezug vormerken (neues Gespräch).
  useEffect(() => {
    if (!pendingParagraphId) return;
    if (activeTalkId) {
      onParagraphConsumed?.();
      return;
    }
    let cancelled = false;
    void ParagraphRepository.findById(pendingParagraphId).then((p) => {
      if (cancelled) return;
      if (p) {
        setContextParagraph({
          id: p.id,
          text: p.textRaw,
          label: paragraphAnchorLabel(p),
        });
      } else {
        setContextParagraph({ id: pendingParagraphId, text: '', label: 'Absatz' });
      }
      onParagraphConsumed?.();
    });
    return () => { cancelled = true; };
  }, [pendingParagraphId, activeTalkId, onParagraphConsumed]);

  // Bestehendes Gespräch: Absatz-Kontext aus Talk wiederherstellen bzw. löschen.
  useEffect(() => {
    if (!activeTalkId) return;
    let cancelled = false;
    void TalkRepository.findById(activeTalkId).then(async (talk) => {
      if (cancelled) return;
      const pid = talk?.kontextParagraphId;
      if (!pid) {
        setContextParagraph(null);
        return;
      }
      const p = await ParagraphRepository.findById(pid);
      if (cancelled) return;
      if (p) {
        setContextParagraph({
          id: p.id,
          text: p.textRaw,
          label: paragraphAnchorLabel(p),
        });
      } else {
        setContextParagraph({
          id: pid,
          text: talk?.kontextParagraph ?? '',
          label: talk?.kontextParagraph ?? 'Absatz',
        });
      }
    });
    return () => { cancelled = true; };
  }, [activeTalkId]);

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

  // Welle 5a/5c — Pin-Status + Modus des aktiven Gesprächs (schützt vor Nacht-Cleanup
  // unpinned Talks bzw. steuert DeepSeek Chat/Nachdenken-Modus, Contract §3).
  useEffect(() => {
    if (!activeTalkId) {
      setPinnedState(false);
      setModeState('chat');
      setCompressedUpToTurnIndex(null);
      setContextMeta(null);
      return;
    }
    let cancelled = false;
    void TalkRepository.findById(activeTalkId).then((talk) => {
      if (cancelled) return;
      setPinnedState(Boolean(talk?.pinned));
      setModeState((talk?.mode as ChatMode | null) ?? 'chat');
      setCompressedUpToTurnIndex(talk?.compressedUpToTurnIndex ?? null);
    });
    setContextMeta(null);
    return () => { cancelled = true; };
  }, [activeTalkId]);

  // Welle 5b — Kontextverbrauch: Server-Wert bevorzugt (aus letztem `done`-Event),
  // sonst Client-Fallback-Schätzung aus den geladenen Turns.
  const effectiveContextTokens = contextMeta?.used_tokens
    ?? computeEffectiveContextTokens(turns, compressedUpToTurnIndex);
  const contextLimitTokens = contextMeta?.limit_tokens ?? contextLimitForModel(null);
  const contextRatio = Math.min(1, effectiveContextTokens / contextLimitTokens);

  const handleCompress = useCallback(async () => {
    if (!activeTalkId) return;
    setCompressing(true);
    try {
      const result = await ragrunApi.compressTalk(activeTalkId);
      await TalkRepository.setCompressedUpToTurnIndex(activeTalkId, result.compressed_up_to_turn_index);
      setCompressedUpToTurnIndex(result.compressed_up_to_turn_index);
      setContextMeta(null);
    } catch {
      Alert.alert('Fehler', 'Gespräch konnte nicht verdichtet werden.');
    } finally {
      setCompressing(false);
    }
  }, [activeTalkId]);

  const handleTogglePin = useCallback(async () => {
    if (!activeTalkId) return;
    const next = !pinned;
    setPinnedState(next);
    try {
      await TalkRepository.setPinned(activeTalkId, next);
    } catch {
      setPinnedState(!next);
      Alert.alert('Fehler', 'Pin konnte nicht gespeichert werden.');
    }
  }, [activeTalkId, pinned]);

  const handleSelectMode = useCallback(async (next: ChatMode) => {
    setModePickerVisible(false);
    if (next === mode) return;
    const previous = mode;
    setModeState(next);
    if (activeTalkId) {
      try {
        await TalkRepository.setMode(activeTalkId, next);
      } catch {
        setModeState(previous);
        Alert.alert('Fehler', 'Modus konnte nicht gespeichert werden.');
      }
    }
  }, [activeTalkId, mode]);

  const handleStop = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleSend = useCallback(async (overrideText?: string, overrideTurnIndex?: number) => {
    const text = (overrideText ?? inputText).trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);
    setPendingUserMessage(text);
    setStreamingText('');
    setStreamingStatus(null);
    setLastUpdatedNote(null);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let accumulated = '';

    try {
      for await (const event of ragrunApi.streamChat(
        {
          message: text,
          personality: 'assistant-host',
          talk_id: activeTalkId ?? undefined,
          mode,
          ...(linkedNote ? {
            linked_document_id: linkedNote.id,
            document_outline: buildDocumentOutline(linkedNote.content),
            linked_document_content: linkedNote.content,
          } : {}),
          ...(contextParagraph || linkedNote ? {
            ...(contextParagraph ? {
              context_mode: 'paragraph' as const,
              context_paragraph_text: contextParagraph.text,
            } : {}),
            context_ids: {
              ...(contextParagraph ? { paragraph_id: contextParagraph.id } : {}),
              ...(linkedNote ? { note_id: linkedNote.id } : {}),
            },
          } : {}),
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
          setContextMeta(event.context_meta);
          const isNewTalk = !activeTalkId;
          if (isNewTalk) {
            await TalkRepository.create({
              id: event.talk_id,
              userId: LOCAL_USER,
              title: text.slice(0, 60),
              kontextParagraphId: contextParagraph?.id,
              kontextParagraph: contextParagraph?.label,
            });
            if (pendingAttachNote) {
              await NoteRepository.attachToTalk(pendingAttachNote, event.talk_id);
              await TalkRepository.setKontextMeta(event.talk_id, { note_id: pendingAttachNote.id });
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
            turnIndex: isNewTalk ? 0 : (overrideTurnIndex ?? turns.length),
            userMessage: text,
            personality: 'assistant-host',
            assistantMessage: event.assistant_message,
            chunkIndexMap,
            usage: event.usage,
          });

          const effects = await dispatchToolEffects(event, {
            talkId: event.talk_id,
            turnId: event.turn_id,
            linkedNote,
          });
          if (effects.updatedNote) setLastUpdatedNote(effects.updatedNote);
          if (effects.createdNote && !linkedNote) {
            await NoteRepository.attachToTalk(effects.createdNote, event.talk_id);
          }
          const noteForTalk = effects.createdNote ?? linkedNote;
          if (noteForTalk) {
            await NoteRepository.attachToTalk(noteForTalk, event.talk_id);
            await TalkRepository.setKontextMeta(event.talk_id, { note_id: noteForTalk.id });
          }
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
              kontextParagraphId: contextParagraph?.id,
              kontextParagraph: contextParagraph?.label,
            });
            talkId = newTalk.id;
            if (pendingAttachNote) {
              await NoteRepository.attachToTalk(pendingAttachNote, talkId);
              await TalkRepository.setKontextMeta(talkId, { note_id: pendingAttachNote.id });
              setPendingAttachNote(null);
            }
            onActiveTalkChange(talkId);
          }
          await TurnRepository.create({
            talkId: talkId!,
            turnIndex: isNewTalk ? 0 : (overrideTurnIndex ?? turns.length),
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
  }, [inputText, activeTalkId, sending, turns.length, onActiveTalkChange, pendingAttachNote, contextParagraph, linkedNote, mode]);

  const handleCopyTurnText = useCallback(async (text: string) => {
    setMenuTurn(null);
    await Clipboard.setStringAsync(text);
  }, []);

  const handleEditTurn = useCallback(async (turn: Turn) => {
    setMenuTurn(null);
    if (turn.turnIndex == null) return;
    try {
      await TurnRepository.deleteFromIndex(turn.talkId, turn.turnIndex);
      setInputText(turn.userMessage ?? '');
    } catch {
      Alert.alert('Fehler', 'Nachricht konnte nicht bearbeitet werden.');
    }
  }, []);

  const handleRetryTurn = useCallback(async (turn: Turn) => {
    setMenuTurn(null);
    if (turn.turnIndex == null || !turn.userMessage) return;
    try {
      await TurnRepository.deleteFromIndex(turn.talkId, turn.turnIndex);
      await handleSend(turn.userMessage, turn.turnIndex);
    } catch {
      Alert.alert('Fehler', 'Nachricht konnte nicht wiederholt werden.');
    }
  }, [handleSend]);

  const handleKopieren = useCallback(async () => {
    if (!activeTalkId) return;
    const markdown = formatTalkAsMarkdown(turns, referencesByTurnId);
    await Clipboard.setStringAsync(markdown);
  }, [activeTalkId, turns, referencesByTurnId]);

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
    if (linkedNote) {
      await NoteRepository.attachToTalk(linkedNote, null);
      if (activeTalkId) await TalkRepository.setKontextMeta(activeTalkId, null);
    }
    setPendingAttachNote(null);
    setPreviewVisible(false);
  }, [linkedNote, activeTalkId]);

  const handleAttachPress = useCallback(() => {
    if (linkedNote) {
      setPreviewVisible(true);
      return;
    }
    setCreatingNote(true);
  }, [linkedNote]);

  const handleNeuerChat = useCallback(() => {
    if (sending) return;
    setInputText('');
    setPendingAttachNote(null);
    setContextParagraph(null);
    onActiveTalkChange(null);
  }, [sending, onActiveTalkChange]);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      {(activeTalkId || linkedNote || contextParagraph) ? (
        <View style={[styles.talkHeader, { borderBottomColor: colors.outlineVariant }]}>
          {linkedNote ? (
            <TouchableOpacity onPress={handleAttachPress} style={styles.talkTitle} activeOpacity={0.8}>
              <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
                <Text style={[textStyles.noteMeta, { color: badgeStyle.textColor }]} numberOfLines={1}>
                  {`Arbeitstext: ${firstWords(extractDocumentTitle(linkedNote.content))}`}
                </Text>
              </View>
            </TouchableOpacity>
          ) : contextParagraph ? (
            <View style={styles.talkTitle}>
              <View style={[styles.badge, { backgroundColor: badgeStyle.backgroundColor }]}>
                <Text style={[textStyles.noteMeta, { color: badgeStyle.textColor }]} numberOfLines={1}>
                  {`Absatz: ${contextParagraph.label}`}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.talkTitle} />
          )}
          {activeTalkId && (
            <>
              <TouchableOpacity onPress={handleNeuerChat} disabled={sending} hitSlop={8}>
                <Ionicons name="create-outline" size={20} color={sending ? colors.onSurfaceVariant : colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAttachPress} hitSlop={8}>
                <AppIcon
                  name={ICONS.arbeitstext.attach}
                  size={ICON_SIZES.menu}
                  color={linkedNote ? colors.primary : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => void handleKopieren()} hitSlop={8}>
                <Ionicons name="copy-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTogglePin} hitSlop={8}>
                <AppIcon
                  name={ICONS.talk.pin}
                  size={ICON_SIZES.menu}
                  color={pinned ? colors.primary : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setContextSheetVisible(true)} hitSlop={8}>
                <View
                  style={[
                    styles.contextBarTrack,
                    { backgroundColor: colors.surfaceContainerHigh },
                  ]}
                >
                  <View
                    style={[
                      styles.contextBarFill,
                      {
                        width: `${Math.round(contextRatio * 100)}%`,
                        backgroundColor: contextRatio > 0.85 ? colors.error : colors.primary,
                      },
                    ]}
                  />
                </View>
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
            <TouchableOpacity
              activeOpacity={0.8}
              onLongPress={() => setMenuTurn({ turn, part: 'user' })}
              style={[styles.bubble, { backgroundColor: colors.surfaceContainerLow }]}
            >
              <InlineMdText
                text={turn.userMessage}
                style={[textStyles.noteBody, { color: colors.onSurface }]}
              />
            </TouchableOpacity>
            <TurnMetaLine turn={turn} kind="user" />

            {turn.assistantMessage ? (
              <>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onLongPress={() => setMenuTurn({ turn, part: 'assistant' })}
                  style={[styles.bubble, { backgroundColor: colors.secondaryContainer }]}
                >
                  <AssistantMessageText
                    text={turn.assistantMessage}
                    onCitationPress={(idx) => openInsights(turn, idx)}
                  />
                </TouchableOpacity>
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
                <InlineMdText
                  text={pendingUserMessage}
                  style={[textStyles.noteBody, { color: colors.onSurface }]}
                />
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

      {lastUpdatedNote && !sending && (
        <TouchableOpacity
          onPress={() => setPreviewVisible(true)}
          style={[styles.updatedChip, { backgroundColor: badgeStyle.backgroundColor }]}
          activeOpacity={0.8}
        >
          <Text style={[textStyles.noteMeta, { color: badgeStyle.textColor }]} numberOfLines={1}>
            {`📄 ${firstWords(extractDocumentTitle(lastUpdatedNote.content))} aktualisiert`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Eingabe */}
      <View style={[styles.inputRow, { borderTopColor: colors.outlineVariant, paddingBottom: insets.bottom || spacing.m }]}>
        <TouchableOpacity
          onPress={() => setModePickerVisible(true)}
          style={[styles.modeChip, { backgroundColor: colors.surfaceContainerHigh }]}
          activeOpacity={0.8}
        >
          <Text style={[textStyles.noteMeta, { color: colors.onSurface }]}>
            {chatModeLabel(mode)}
          </Text>
          <Ionicons name="chevron-down" size={14} color={colors.onSurfaceVariant} />
        </TouchableOpacity>
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
          onSubmitEditing={() => void handleSend()}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={sending ? handleStop : () => void handleSend()}
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
      <Modal visible={modePickerVisible} transparent animationType="fade" onRequestClose={() => setModePickerVisible(false)}>
        <Pressable style={styles.modeBackdrop} onPress={() => setModePickerVisible(false)}>
          <View style={[styles.modeMenu, { backgroundColor: colors.surfaceContainerHigh }]}>
            {CHAT_MODES.map((m) => (
              <TouchableOpacity
                key={m.value}
                onPress={() => void handleSelectMode(m.value)}
                style={styles.modeMenuItem}
              >
                <Text style={[typography.bodyMedium, { color: m.value === mode ? colors.primary : colors.onSurface }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>

      <Modal visible={menuTurn != null} transparent animationType="fade" onRequestClose={() => setMenuTurn(null)}>
        <Pressable style={styles.modeBackdrop} onPress={() => setMenuTurn(null)}>
          <View style={[styles.modeMenu, { backgroundColor: colors.surfaceContainerHigh }]}>
            {menuTurn?.part === 'user' && (
              <>
                <TouchableOpacity
                  onPress={() => void handleEditTurn(menuTurn.turn)}
                  style={styles.modeMenuItem}
                >
                  <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>Bearbeiten</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void handleRetryTurn(menuTurn.turn)}
                  style={styles.modeMenuItem}
                >
                  <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>Wiederholen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => void handleCopyTurnText(menuTurn.turn.userMessage ?? '')}
                  style={styles.modeMenuItem}
                >
                  <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>Kopieren</Text>
                </TouchableOpacity>
              </>
            )}
            {menuTurn?.part === 'assistant' && (
              <TouchableOpacity
                onPress={() => void handleCopyTurnText(menuTurn.turn.assistantMessage ?? '')}
                style={styles.modeMenuItem}
              >
                <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>Kopieren</Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={contextSheetVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setContextSheetVisible(false)}
      >
        <Pressable style={styles.modeBackdrop} onPress={() => setContextSheetVisible(false)}>
          <View style={[styles.contextSheet, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={[typography.titleSmall, { color: colors.onSurface }]}>
              Kontextspeicher
            </Text>
            <View style={[styles.contextBarTrack, styles.contextSheetBar, { backgroundColor: colors.surfaceContainerHighest }]}>
              <View
                style={[
                  styles.contextBarFill,
                  {
                    width: `${Math.round(contextRatio * 100)}%`,
                    backgroundColor: contextRatio > 0.85 ? colors.error : colors.primary,
                  },
                ]}
              />
            </View>
            <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
              {`${effectiveContextTokens.toLocaleString('de-DE')} / ${contextLimitTokens.toLocaleString('de-DE')} Token`}
            </Text>
            <TouchableOpacity
              onPress={() => void handleCompress()}
              disabled={compressing || !activeTalkId || turns.length < 3}
              style={[styles.compressBtn, { backgroundColor: colors.primary }]}
            >
              {compressing ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={[typography.bodyMedium, { color: colors.onPrimary }]}>
                  Verdichten
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

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
    gap: spacing.m,
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
  updatedChip: {
    alignSelf: 'flex-start',
    marginHorizontal: spacing.m,
    marginTop: spacing.xs,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 6,
  },
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
  modeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s,
    height: 38,
    borderRadius: 19,
  },
  modeBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modeMenu: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.xl,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modeMenuItem: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.m,
  },
  contextBarTrack: {
    width: 44,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  contextBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  contextSheet: {
    marginHorizontal: spacing.m,
    marginBottom: spacing.xl,
    borderRadius: 12,
    padding: spacing.l,
    gap: spacing.s,
  },
  contextSheetBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
  },
  compressBtn: {
    marginTop: spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: spacing.s,
  },
});
