import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, TouchableOpacity, StyleSheet, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, textStyles } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';

import type { Paragraph } from '@/data/repositories/ParagraphRepository';

type Props = {
  visible: boolean;
  onClose: () => void;
  paragraph: Paragraph | null;
  sourceId: string;
};

export default function ContributionsScreen({
  visible, onClose, paragraph,
}: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const contextLabel = useMemo(() => {
    if (!paragraph) return null;
    return t('contributions.contextBreadcrumb', {
      segmentTitle: paragraph.segment_title,
      paragraphNumber: paragraph.paragraph_number,
    });
  }, [paragraph, t]);

  if (!visible || !paragraph) return null;

  return (
    <View style={[overlayStyles.fullscreen, styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.appBar, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[textStyles.contributionsTitle, { color: colors.onBackground, flex: 1 }]} numberOfLines={1}>
          {t('contributions.title')}
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

      <View style={styles.emptyState}>
        <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
          {t('contributions.empty')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  backBtn: { padding: spacing.xs },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.m,
  },
});
