import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, useColorScheme, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, textStyles, typography, ICONS, ICON_SIZES } from '@/shared/theme';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import AppIcon from '@/shared/components/AppIcon';
import ArbeitstextLinkSheet from '@/shared/components/ArbeitstextLinkSheet';
import DocumentPreviewOverlay from '@/shared/components/DocumentPreviewOverlay';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';
import type Note from '@/data/db/models/Note';

const LOCAL_USER = 'local';

const PERSONALITY_LABELS: Record<string, string> = {
  sokrates: 'Sokrates',
  socrates: 'Sokrates',
  'der-machtarchitekt': 'Der Machtarchitekt',
  'assistant-host': 'Assistant Host',
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
};

/** CHAT-Segment des Filo-Tabs: aktives Gespräch oder Leerzustand mit Eingabefeld. */
export default function ChatTab({ activeTalkId, onActiveTalkChange, linkNoteId, onLinkNoteConsumed }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const [talk, setTalk] = useState<Talk | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [copying, setCopying] = useState(false);
  const [linkedNote, setLinkedNote] = useState<Note | null>(null);
  const [linkSheetVisible, setLinkSheetVisible] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Arbeitstext-Verknüpfung ist chat-lokal (Filo §6, max. 1 Dokument) — beim Wechsel des Gesprächs zurücksetzen.
  useEffect(() => {
    setLinkedNote(null);
  }, [activeTalkId]);

  // „In Gespräch bearbeiten“ aus der Arbeitstexte-Bibliothek: Arbeitstext direkt verknüpfen.
  useEffect(() => {
    if (!linkNoteId) return;
    let cancelled = false;
    void NoteRepository.findById(linkNoteId).then((note) => {
      if (!cancelled && note) setLinkedNote(note);
      onLinkNoteConsumed?.();
    });
    return () => { cancelled = true; };
  }, [linkNoteId, onLinkNoteConsumed]);

  useEffect(() => {
    if (!activeTalkId) {
      setTalk(null);
      setTurns([]);
      return;
    }

    let cancelled = false;

    void TalkRepository.findById(activeTalkId).then((t) => {
      if (!cancelled) setTalk(t);
    });

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

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);
    try {
      const isNewTalk = !activeTalkId;
      let talkId = activeTalkId;
      if (isNewTalk) {
        const newTalk = await TalkRepository.create({ userId: LOCAL_USER, title: text.slice(0, 60) });
        talkId = newTalk.id;
        onActiveTalkChange(talkId);
      }
      await TurnRepository.create({
        talkId: talkId!,
        turnIndex: isNewTalk ? 0 : turns.length,
        userMessage: text,
        personality: 'assistant-host',
        assistantMessage: undefined,
      });
      // TODO: ragrun-API aufrufen und assistantMessage updaten (Welle 3a/3b)
    } catch {
      Alert.alert('Fehler', 'Nachricht konnte nicht gesendet werden.');
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, activeTalkId, sending, turns.length, onActiveTalkChange]);

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

  const handleLinkDocument = useCallback((note: Note) => {
    setLinkedNote(note);
    setLinkSheetVisible(false);
  }, []);

  const handleDetachDocument = useCallback(() => {
    setLinkedNote(null);
    setPreviewVisible(false);
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      {(activeTalkId && talk) || linkedNote ? (
        <>
          {activeTalkId && talk ? (
            <View style={[styles.talkHeader, { borderBottomColor: colors.outlineVariant }]}>
              <Text
                style={[textStyles.labelSection, styles.talkTitle, { color: colors.onSurface }]}
                numberOfLines={1}
              >
                {talk.title ?? 'Gespräch'}
              </Text>
              <TouchableOpacity onPress={() => setLinkSheetVisible(true)} hitSlop={8}>
                <AppIcon
                  name={ICONS.arbeitstext.attach}
                  size={ICON_SIZES.menu}
                  color={linkedNote ? colors.primary : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleKopieren} disabled={copying} hitSlop={8}>
                <Ionicons name="copy-outline" size={20} color={copying ? colors.onSurfaceVariant : colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.talkHeader, { borderBottomColor: colors.outlineVariant }]}>
              <Text style={[textStyles.labelSection, styles.talkTitle, { color: colors.onSurfaceVariant }]}>
                Neues Gespräch
              </Text>
              <TouchableOpacity onPress={() => setLinkSheetVisible(true)} hitSlop={8}>
                <AppIcon
                  name={ICONS.arbeitstext.attach}
                  size={ICON_SIZES.menu}
                  color={linkedNote ? colors.primary : colors.onSurfaceVariant}
                />
              </TouchableOpacity>
            </View>
          )}
          {linkedNote && (
            <TouchableOpacity
              style={[styles.chip, { backgroundColor: colors.surfaceContainerLow, borderColor: colors.outlineVariant }]}
              onPress={() => setPreviewVisible(true)}
              activeOpacity={0.8}
            >
              <AppIcon name={ICONS.arbeitstext.preview} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
              <Text style={[textStyles.noteMeta, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>
                {extractDocumentTitle(linkedNote.content)}
              </Text>
              <TouchableOpacity onPress={handleDetachDocument} hitSlop={8}>
                <AppIcon name={ICONS.arbeitstext.detach} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        </>
      ) : null}

      <FlatList
        ref={flatListRef}
        data={turns}
        keyExtractor={(t) => `${t.talkId}-${t.turnIndex}`}
        contentContainerStyle={styles.turnListContent}
        renderItem={({ item: turn }) => (
          <View style={styles.turnBlock}>
            <View style={[styles.bubble, { backgroundColor: colors.surfaceContainerLow }]}>
              <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                Du
              </Text>
              <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
                {turn.userMessage}
              </Text>
            </View>
            {turn.assistantMessage ? (
              <View style={[styles.bubble, { backgroundColor: colors.secondaryContainer }]}>
                <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                  {personalityLabel(turn.personality)}
                </Text>
                <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
                  {turn.assistantMessage}
                </Text>
              </View>
            ) : (
              <View style={[styles.bubble, { backgroundColor: colors.secondaryContainer }]}>
                <ActivityIndicator size="small" color={colors.onSecondaryContainer} />
              </View>
            )}
            {/* Schnitt-Kontextmenü */}
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
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              Noch keine Nachrichten. Stelle eine Frage!
            </Text>
          </View>
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
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          style={[styles.sendBtn, { backgroundColor: inputText.trim() ? colors.primary : colors.surfaceContainerHigh }]}
          activeOpacity={0.8}
        >
          {sending ? (
            <ActivityIndicator size="small" color={colors.onPrimary} />
          ) : (
            <Ionicons name="arrow-up" size={20} color={inputText.trim() ? colors.onPrimary : colors.onSurfaceVariant} />
          )}
        </TouchableOpacity>
      </View>

      <ArbeitstextLinkSheet
        visible={linkSheetVisible}
        onClose={() => setLinkSheetVisible(false)}
        onLink={handleLinkDocument}
        talkId={activeTalkId}
      />
      {previewVisible && (
        <DocumentPreviewOverlay
          note={linkedNote}
          onClose={() => setPreviewVisible(false)}
          onDetach={handleDetachDocument}
        />
      )}
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
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.m, marginTop: spacing.s,
    paddingHorizontal: spacing.s, paddingVertical: spacing.xs,
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  turnListContent: { padding: spacing.m, gap: spacing.l, flexGrow: 1 },
  turnBlock: { gap: spacing.s },
  bubble: { borderRadius: 12, padding: spacing.m, gap: spacing.xs },
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
