import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { getEntityCardStyle, type EntityKind } from '@/shared/theme/entityCards';
import { colorWithAlpha } from '@/shared/lib/color';
import type { NotizCardRows } from '@/shared/lib/notizSearchCard';
import type { SearchHitCardBodyMode } from '@/shared/lib/searchHitCard';

type Props = {
  kind: EntityKind;
  /** Zeile 2 (klein, grau) — Autor+Werk, Ort+Datum, … */
  metaSmall?: string;
  /** Zeile 3 (groß) — Kapitel-, Vortrags-, Begriffstitel, … */
  headlineLarge?: string;
  /**
   * Notiz: Zeile 2 fett (Autor der Notiz, Datum), Zeile 3 optional Kontext, Zeile 4 Titel,
   * dann Trennstrich und Vorschau.
   */
  notizRows?: NotizCardRows;
  bodyMode?: SearchHitCardBodyMode;
  /** Snippet / Zitat / Chunk-Anfang (nach Trennstrich). */
  bodyText?: string;
  /** Nur Suchliste: Relevanz in Akzentfarbe des Typs (0–100). */
  relevancePercent?: number;
  onPress?: () => void;
};

export default function EntityResultCard({
  kind,
  metaSmall,
  headlineLarge,
  notizRows,
  bodyMode = 'truncated_text',
  bodyText = '',
  relevancePercent,
  onPress,
}: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const cardStyle = getEntityCardStyle(colors, kind, isDark);

  const trimmedBody = bodyText.trim();
  const showDivider = Boolean(notizRows) || Boolean(trimmedBody);
  const isExtendedBodyKind = kind === 'chunk_buch' || kind === 'chunk_vortrag';
  const bodyLines = isExtendedBodyKind ? 5 : 3;
  const bodyTextStyle = isExtendedBodyKind
    ? [textStyles.noteBody, { fontSize: 14, lineHeight: 20 }] as const
    : textStyles.noteBody;

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.85 : 1}
      onPress={onPress}
      disabled={!onPress}
      style={[
        styles.card,
        {
          backgroundColor: cardStyle.backgroundColor,
          borderColor: cardStyle.borderColor,
          borderWidth: cardStyle.borderWidth,
          borderRadius: cardStyle.borderRadius,
        },
      ]}
    >
      <View style={styles.metaRow}>
        <View style={[styles.lozenge, { backgroundColor: colorWithAlpha(cardStyle.accentColor, 0.15) }]}>
          <Text style={[textStyles.noteMeta, { color: cardStyle.accentColor, letterSpacing: 0.8 }]}>
            {cardStyle.label.toUpperCase()}
          </Text>
        </View>
      </View>

      {notizRows ? (
        <>
          <Text
            style={[
              textStyles.noteMeta,
              { color: colors.onSurfaceVariant, fontWeight: '700' },
            ]}
            numberOfLines={2}
          >
            {notizRows.authorDateBold}
          </Text>
          {notizRows.contextSmall ? (
            <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {notizRows.contextSmall}
            </Text>
          ) : null}
          <Text
            style={[textStyles.chapterTitle, { color: colors.onBackground, textAlign: 'left' }]}
            numberOfLines={3}
          >
            {notizRows.titleLarge}
          </Text>
        </>
      ) : (
        <>
          {metaSmall?.trim() ? (
            <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]} numberOfLines={2}>
              {metaSmall.trim()}
            </Text>
          ) : null}
          {headlineLarge?.trim() ? (
            kind === 'kapitel_zusammenfassung' ? (
              <Text
                style={[textStyles.noteMeta, { color: colors.onSurface, fontWeight: '700', fontSize: 13, lineHeight: 18 }]}
                numberOfLines={3}
              >
                {headlineLarge.trim()}
              </Text>
            ) : (
              <Text
                style={[textStyles.chapterTitle, { color: colors.onBackground, textAlign: 'left' }]}
                numberOfLines={3}
              >
                {headlineLarge.trim()}
              </Text>
            )
          ) : null}
        </>
      )}

      {showDivider ? (
        <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />
      ) : null}

      {trimmedBody ? (
        bodyMode === 'full_quote' ? (
          <Text style={[bodyTextStyle, { color: colors.onSurface }]}>
            {trimmedBody}
          </Text>
        ) : (
          <Text
            style={[bodyTextStyle, { color: colors.onSurface }]}
            numberOfLines={bodyLines}
            ellipsizeMode="tail"
          >
            {trimmedBody}
          </Text>
        )
      ) : null}

    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.m, gap: spacing.xs },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  lozenge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs, alignSelf: 'stretch' },
});
