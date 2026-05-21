import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import { useReading } from '@/shared/contexts/ReadingContext';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';
import type Paragraph from '@/data/db/models/Paragraph';

const PERSONALITY_LABELS: Record<string, string> = {
  sokrates: 'Sokrates',
  socrates: 'Sokrates',
  'der-machtarchitekt': 'Der Machtarchitekt',
  'assistant-host': 'Assistant Host',
  'assistant-host-deep': 'Assistant Host Deep',
};

type Props = {
  visible: boolean;
  talkId: string;
  anchorParagraphId: string | null;
  anchorTurnIndex: number;
  sourceId: string;
  onClose: () => void;
};

function personalityLabel(slug: string | null | undefined): string {
  if (!slug) return 'KI';
  return PERSONALITY_LABELS[slug] ?? slug;
}

export default function ConversationDetailScreen({
  visible, talkId, anchorParagraphId, anchorTurnIndex, sourceId, onClose,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const { navigateToRead, navigateToChatWithTalk, closeConversationDetail } = useReading();

  const fundstelleAccent = useMemo(() => ({
    border: isDark ? colors.tertiary : colors.onTertiaryContainer,
    label: colors.tertiary,
    shadow: isDark ? colors.tertiaryContainer : colors.onTertiaryContainer,
  }), [colors, isDark]);

  const fundstelleFrameStyle = useMemo(() => ({
    borderColor: fundstelleAccent.border,
    shadowColor: fundstelleAccent.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: isDark ? 0.28 : 0.16,
    shadowRadius: 10,
    elevation: 4,
  }), [fundstelleAccent, isDark]);

  const [talk, setTalk] = useState<Talk | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [anchorParagraph, setAnchorParagraph] = useState<Paragraph | null>(null);
  const [copying, setCopying] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const turnLayoutsRef = useRef<Map<number, number>>(new Map());
  const didScrollToAnchorRef = useRef(false);

  useEffect(() => {
    if (!visible) {
      setTalk(null);
      setTurns([]);
      setAnchorParagraph(null);
      didScrollToAnchorRef.current = false;
      turnLayoutsRef.current.clear();
      return;
    }

    let cancelled = false;

    const refresh = async () => {
      const [t, turnList] = await Promise.all([
        TalkRepository.findById(talkId),
        TurnRepository.findAllByTalk(talkId),
      ]);
      const para = anchorParagraphId
        ? await ParagraphRepository.findByParagraphId(anchorParagraphId)
        : null;
      if (cancelled) return;
      setTalk(t);
      setTurns(turnList);
      setAnchorParagraph(para);
    };

    void refresh();

    const turnSub = TurnRepository.observeByTalk(talkId).subscribe((list) => {
      if (!cancelled) setTurns(list);
    });

    return () => {
      cancelled = true;
      turnSub.unsubscribe();
    };
  }, [visible, talkId, anchorParagraphId]);

  const contextLabel = useMemo(() => {
    if (!anchorParagraph) return null;
    const typeLabel = 'Kapitel';
    return `${typeLabel} · ${anchorParagraph.segmentTitle} · ¶${anchorParagraph.paragraphNumber}`;
  }, [anchorParagraph]);

  const scrollToAnchor = useCallback(() => {
    const y = turnLayoutsRef.current.get(anchorTurnIndex);
    if (y != null) {
      scrollRef.current?.scrollTo({ y: Math.max(0, y - spacing.m), animated: true });
      didScrollToAnchorRef.current = true;
    }
  }, [anchorTurnIndex]);

  useEffect(() => {
    if (!visible || turns.length === 0 || didScrollToAnchorRef.current) return;
    const timer = setTimeout(scrollToAnchor, 80);
    return () => clearTimeout(timer);
  }, [visible, turns, scrollToAnchor]);

  const handleOpenInReader = useCallback(() => {
    if (!anchorParagraph) return;
    onClose();
    navigateToRead({
      sourceId,
      segmentIndex: anchorParagraph.segmentIndex,
      paragraphId: anchorParagraph.paragraphId,
    });
  }, [anchorParagraph, sourceId, onClose, navigateToRead]);

  const handleFortfuehren = useCallback(() => {
    closeConversationDetail();
    navigateToChatWithTalk(talkId);
  }, [talkId, closeConversationDetail, navigateToChatWithTalk]);

  const handleKopieren = useCallback(async () => {
    setCopying(true);
    try {
      const newTalk = await TalkRepository.copyTalk(talkId);
      closeConversationDetail();
      navigateToChatWithTalk(newTalk.id);
    } catch (e) {
      Alert.alert('Fehler', 'Gespräch konnte nicht kopiert werden.');
    } finally {
      setCopying(false);
    }
  }, [talkId, closeConversationDetail, navigateToChatWithTalk]);

  if (!visible) return null;

  return (
    <View style={[overlayStyles.fullscreen, styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.appBar, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[textStyles.contributionsTitle, { color: colors.onBackground, flex: 1 }]} numberOfLines={1}>
          Gespräch
        </Text>
      </View>

      {contextLabel && (
        <TouchableOpacity onPress={handleOpenInReader} activeOpacity={0.7}>
          <Text
            style={[textStyles.contributionsBreadcrumb, { color: colors.primary, paddingHorizontal: spacing.m, paddingTop: spacing.s }]}
            numberOfLines={2}
          >
            {contextLabel}
          </Text>
        </TouchableOpacity>
      )}

      {talk?.title ? (
        <Text style={[textStyles.chapterTitle, { color: colors.onBackground, paddingHorizontal: spacing.m, paddingTop: spacing.xs, textAlign: 'left' }]}>
          {talk.title}
        </Text>
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        onContentSizeChange={() => {
          if (!didScrollToAnchorRef.current) scrollToAnchor();
        }}
      >
        {turns.map((turn) => {
          const isAnchor = anchorParagraphId !== null && turn.turnIndex === anchorTurnIndex;
          return (
            <View
              key={`${turn.talkId}-${turn.turnIndex}`}
              onLayout={(e) => {
                turnLayoutsRef.current.set(turn.turnIndex, e.nativeEvent.layout.y);
                if (turn.turnIndex === anchorTurnIndex && !didScrollToAnchorRef.current) {
                  requestAnimationFrame(scrollToAnchor);
                }
              }}
              style={[
                styles.turnBlock,
                isAnchor && styles.turnBlockAnchor,
                isAnchor && fundstelleFrameStyle,
              ]}
            >
              {isAnchor ? (
                <View style={styles.turnHeader}>
                  <View style={[styles.fundstelleBadge, { borderColor: fundstelleAccent.border }]}>
                    <Text style={[textStyles.noteMeta, { color: fundstelleAccent.label }]}>Fundstelle</Text>
                  </View>
                </View>
              ) : null}
              <View style={styles.bubble}>
                <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                  Du
                </Text>
                <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>{turn.userMessage}</Text>
              </View>
              {turn.assistantMessage ? (
                <View style={styles.bubble}>
                  <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
                    {personalityLabel(turn.personality)}
                  </Text>
                  <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>{turn.assistantMessage}</Text>
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>

      {/* Aktionsleiste */}
      <View style={[styles.actionBar, { borderTopColor: colors.outlineVariant, paddingBottom: insets.bottom || spacing.m }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.secondaryContainer }]}
          onPress={handleFortfuehren}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.onSecondaryContainer} />
          <Text style={[textStyles.noteMeta, { color: colors.onSecondaryContainer }]}>
            Gespräch fortführen
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.surfaceContainerHigh }]}
          onPress={handleKopieren}
          disabled={copying}
          activeOpacity={0.8}
        >
          <Ionicons name="copy-outline" size={16} color={colors.onSurfaceVariant} />
          <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
            {copying ? 'Kopiere…' : 'Gespräch kopieren'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: { padding: spacing.m, gap: spacing.l, paddingBottom: spacing.xxl },
  turnBlock: {
    gap: spacing.s,
  },
  turnBlockAnchor: {
    borderWidth: 1,
    borderRadius: 14,
    padding: spacing.s,
    backgroundColor: 'transparent',
  },
  turnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.s,
  },
  fundstelleBadge: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.s,
    paddingVertical: 2,
    backgroundColor: 'transparent',
  },
  bubble: {
    borderRadius: 12,
    padding: spacing.m,
    gap: spacing.xs,
  },
  actionBar: {
    flexDirection: 'row',
    gap: spacing.s,
    paddingHorizontal: spacing.m,
    paddingTop: spacing.s,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 10,
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
  },
});
