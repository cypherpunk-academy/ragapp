import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import { useReading } from '@/shared/contexts/ReadingContext';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { TurnRepository } from '@/data/repositories/TurnRepository';

import type Talk from '@/data/db/models/Talk';
import type Turn from '@/data/db/models/Turn';
import type Paragraph from '@/data/db/models/Paragraph';
import { getTalkAnchorTurnIndex } from '@/shared/lib/talkAnchor';
import TalkCard from '@/shared/components/TalkCard';
import { useAuth } from '@/shared/hooks/useAuth';

type TalkWithTurn = { talk: Talk; snippetTurn: Turn | null };

type Props = {
  visible: boolean;
  onClose: () => void;
  paragraph: Paragraph | null;
  sourceId: string;
};

export default function ContributionsScreen({
  visible, onClose, paragraph, sourceId,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { loading: authLoading, isAuthenticated, isConfigured } = useAuth();
  const { openConversationDetail, navigateToChatWithParagraph } = useReading();
  const [talks, setTalks] = useState<TalkWithTurn[]>([]);

  useEffect(() => {
    if (!paragraph || !visible || !isAuthenticated) {
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
      const talkList = await TalkRepository.findByParagraph(paragraph.id);
      if (cancelled) return;
      setTalks(await loadTalks(talkList));
    };

    void refresh();

    const talkSub = TalkRepository.observeByParagraph(paragraph.id).subscribe(() => { void refresh(); });

    return () => {
      cancelled = true;
      talkSub.unsubscribe();
    };
  }, [paragraph, sourceId, visible, isAuthenticated]);

  const contextLabel = useMemo(() => {
    if (!paragraph) return null;
    const typeLabel = 'Kapitel';
    return `${typeLabel} · ${paragraph.segmentTitle} · ¶${paragraph.paragraphNumber}`;
  }, [paragraph]);

  const handleAskPhilo = useCallback(() => {
    if (!paragraph) return;
    onClose();
    navigateToChatWithParagraph(paragraph.id);
  }, [paragraph, onClose, navigateToChatWithParagraph]);

  if (!visible || !paragraph) return null;

  return (
    <View style={[overlayStyles.fullscreen, styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.appBar, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[textStyles.contributionsTitle, { color: colors.onBackground, flex: 1 }]} numberOfLines={1}>
          Gespräche
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
              Gespräche zu diesem Absatz sind nur mit einem Konto sichtbar.
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
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          {talks.length === 0 ? (
            <View style={styles.emptyNotes}>
              <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                Noch keine Gespräche zu diesem Absatz.
              </Text>
              <TouchableOpacity
                style={[styles.createNoteBtn, { backgroundColor: colors.primary }]}
                onPress={handleAskPhilo}
                activeOpacity={0.85}
              >
                <Ionicons name="chatbubble-outline" size={20} color={colors.onPrimary} />
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Philo zu diesem Absatz fragen</Text>
              </TouchableOpacity>
            </View>
          ) : (
            talks.map(({ talk, snippetTurn }) => (
              <TalkCard
                key={talk.id}
                talk={talk}
                snippetTurn={snippetTurn}
                onPress={() => openConversationDetail(
                  talk.id,
                  paragraph.id,
                  getTalkAnchorTurnIndex(talk),
                  sourceId,
                )}
              />
            ))
          )}
        </ScrollView>
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
  content: { padding: spacing.m, gap: spacing.m, paddingBottom: spacing.xxl },
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
