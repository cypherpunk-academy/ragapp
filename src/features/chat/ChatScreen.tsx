import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, StyleSheet, useColorScheme, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AppBar from '@/shared/components/AppBar';
import { lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { useReading } from '@/shared/contexts/ReadingContext';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import TalkCard from '@/shared/components/TalkCard';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';

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

export default function ChatScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { chatTalkId, navigateToChatWithTalk } = useReading();

  const [activeTalkId, setActiveTalkId] = useState<string | null>(null);
  const [talk, setTalk] = useState<Talk | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [allTalks, setAllTalks] = useState<Talk[]>([]);
  const [talkSnippets, setTalkSnippets] = useState<Map<string, Turn | null>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingTalks, setLoadingTalks] = useState(true);
  const [copying, setCopying] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  // Wenn chatTalkId aus dem Context kommt, direkt laden
  useEffect(() => {
    if (chatTalkId) {
      setActiveTalkId(chatTalkId);
    }
  }, [chatTalkId]);

  // Alle Talks für die Dropdown-Auswahl beobachten
  useEffect(() => {
    const sub = TalkRepository.observeAll().subscribe(async (talks) => {
      setAllTalks(talks);
      setLoadingTalks(false);
      // Snippet-Turns für alle Talks laden
      const snippets = new Map<string, Turn | null>();
      await Promise.all(
        talks.map(async (t) => {
          const first = await TurnRepository.findFirstByTalk(t.talkId);
          snippets.set(t.talkId, first);
        }),
      );
      setTalkSnippets(new Map(snippets));
    });
    return () => sub.unsubscribe();
  }, []);

  // Aktives Gespräch + Turns laden
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

  // Nach neuen Turns ans Ende scrollen
  useEffect(() => {
    if (turns.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [turns.length]);

  const filteredTalks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allTalks;
    return allTalks.filter(
      (t) => t.title?.toLowerCase().includes(q) || t.summary?.toLowerCase().includes(q),
    );
  }, [allTalks, searchQuery]);

  const handleSend = useCallback(async () => {
    const text = inputText.trim();
    if (!text || !activeTalkId || sending) return;

    setInputText('');
    setSending(true);
    try {
      const nextIndex = turns.length;
      // Neuen Turn lokal anlegen (API-Integration folgt in späterer Phase)
      await TurnRepository.create({
        talkId: activeTalkId,
        turnIndex: nextIndex,
        userMessage: text,
        assistantPersonality: 'assistant-host',
        assistantMessage: undefined,
      });
      // TODO: ragrun-API aufrufen und assistantMessage updaten
    } catch {
      Alert.alert('Fehler', 'Nachricht konnte nicht gesendet werden.');
      setInputText(text);
    } finally {
      setSending(false);
    }
  }, [inputText, activeTalkId, sending, turns.length]);

  const handleKopieren = useCallback(async () => {
    if (!activeTalkId) return;
    setCopying(true);
    try {
      const newTalk = await TalkRepository.copyTalk(activeTalkId);
      navigateToChatWithTalk(newTalk.talkId);
    } catch {
      Alert.alert('Fehler', 'Gespräch konnte nicht kopiert werden.');
    } finally {
      setCopying(false);
    }
  }, [activeTalkId, navigateToChatWithTalk]);

  const handleSchnittHier = useCallback(async (maxTurnIndex: number) => {
    if (!activeTalkId) return;
    setCopying(true);
    try {
      const newTalk = await TalkRepository.copyTalk(activeTalkId, { maxTurnIndex });
      navigateToChatWithTalk(newTalk.talkId);
    } catch {
      Alert.alert('Fehler', 'Konnte nicht schneiden.');
    } finally {
      setCopying(false);
    }
  }, [activeTalkId, navigateToChatWithTalk]);

  // ─── Gespräch-Auswahl-Screen ─────────────────────────────────────────────
  if (!activeTalkId) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <AppBar title="KI-Chat" />
        <View style={styles.selectorBody}>
          <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Gespräch suchen…"
              placeholderTextColor={colors.onSurfaceVariant}
              style={[typography.bodyMedium, styles.searchInput, { color: colors.onSurface }]}
            />
          </View>
        </View>

        {loadingTalks ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filteredTalks.length === 0 ? (
          <View style={styles.center}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              {searchQuery ? 'Keine Gespräche gefunden.' : 'Noch keine Gespräche vorhanden.'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTalks}
            keyExtractor={(t) => t.talkId}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TalkCard
                talk={item}
                snippetTurn={talkSnippets.get(item.talkId) ?? null}
                onPress={() => setActiveTalkId(item.talkId)}
              />
            )}
          />
        )}
      </View>
    );
  }

  // ─── Aktives Gespräch ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={insets.bottom}
    >
      <AppBar
        title={talk?.title ?? 'Gespräch'}
        onBackPress={() => setActiveTalkId(null)}
        trailing={(
          <TouchableOpacity
            onPress={handleKopieren}
            disabled={copying}
            hitSlop={8}
            style={styles.overflowBtn}
          >
            <Ionicons name="copy-outline" size={20} color={copying ? colors.onSurfaceVariant : colors.primary} />
          </TouchableOpacity>
        )}
      />

      {/* Turn-Liste */}
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
                  {personalityLabel(turn.assistantPersonality)}
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
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  selectorBody: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    gap: spacing.s,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  searchInput: { flex: 1 },
  listContent: { padding: spacing.m, gap: spacing.m },
  overflowBtn: { padding: spacing.xs },
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
