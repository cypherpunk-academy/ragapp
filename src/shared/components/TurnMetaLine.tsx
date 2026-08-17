import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { useTranslation } from 'react-i18next';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { getDateLocale } from '@/shared/i18n';
import type Turn from '@/data/db/models/Turn';

type Props = {
  turn: Turn;
  kind: 'user' | 'assistant';
  personalityLabel?: string;
  /** Anzahl eindeutiger `[N]`-Marker; Fallback: Gesamttreffer. */
  ragHitCount?: number;
  onRagHitsPress?: () => void;
};

function formatTurnTime(createdAt: Date): string {
  return createdAt.toLocaleTimeString(getDateLocale(), { hour: '2-digit', minute: '2-digit' });
}

/**
 * Meta-Zeile unter Chat-Bubbles (Figma §16.6): Zeit · Sender · optional KI-Treffer-Link.
 */
export default function TurnMetaLine({
  turn, kind, personalityLabel, ragHitCount = 0, onRagHitsPress,
}: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const time = formatTurnTime(turn.createdAt);
  const showRagLink = kind === 'assistant' && ragHitCount > 0 && onRagHitsPress;
  const sender = kind === 'user'
    ? t('common.me')
    : (personalityLabel ?? t('common.ki')).toUpperCase();

  return (
    <View style={[styles.row, kind === 'user' ? styles.rowUser : styles.rowAssistant]}>
      <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
        {time}
        {' · '}
        {sender}
      </Text>
      {showRagLink ? (
        <>
          <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}> · </Text>
          <TouchableOpacity onPress={onRagHitsPress} hitSlop={6} activeOpacity={0.7}>
            <Text style={[textStyles.noteMeta, { color: colors.primary }]}>
              {t('ragInsights.linkLabel', { count: ragHitCount })}
            </Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: 6,
    paddingHorizontal: spacing.xs,
  },
  rowUser: { alignSelf: 'flex-end' },
  rowAssistant: { alignSelf: 'flex-start' },
});
