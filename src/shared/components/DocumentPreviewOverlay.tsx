import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, useWindowDimensions,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { lightColors, darkColors, spacing, textStyles, ICONS, ICON_SIZES, getNoteBadgeStyle } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import AppIcon from '@/shared/components/AppIcon';
import DocumentMarkdownView from '@/shared/components/DocumentMarkdownView';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { NoteRepository, type NoteRow } from '@/data/repositories/NoteRepository';

import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { SourceRepository } from '@/data/repositories/SourceRepository';
import { documentUndoStack } from '@/data/tools/documentUndoStack';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import { classifyOwnContextTier, firstWords } from '@/shared/lib/arbeitstextContext';
import { stripSegmentTitleHtml } from '@/shared/lib/segmentTitleDisplay';
import { confirmDeleteNote } from '@/shared/lib/confirmDeleteNote';
import { useReading } from '@/shared/contexts/ReadingContext';

type Props = {
  note: NoteRow | null;
  onClose: () => void;
  onDeleted?: () => void;
};

type NoteBreadcrumb = { label: string; onPress: () => void };

function useNoteBreadcrumb(note: NoteRow | null): NoteBreadcrumb | null {
  const { t } = useTranslation();
  const { navigateToRead } = useReading();
  const [breadcrumb, setBreadcrumb] = useState<NoteBreadcrumb | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!note) {
      setBreadcrumb(null);
      return;
    }
    const tier = classifyOwnContextTier(note);

    (async () => {
      if (tier === 'paragraph' && note.paragraph_id) {
        const paragraph = await ParagraphRepository.findById(note.paragraph_id);
        if (cancelled || !paragraph) return;
        setBreadcrumb({
          label: t('documentPreview.breadcrumbParagraph', { preview: firstWords(paragraph.text_raw) }),
          onPress: () => navigateToRead({ sourceId: paragraph.source_id, segmentIndex: paragraph.segment_index, paragraphId: paragraph.id }),
        });
      } else if (tier === 'segment' && note.source_id && note.segment_slug) {
        const paragraph = await ParagraphRepository.findFirstBySegmentSlug(note.source_id, note.segment_slug);
        if (cancelled || !paragraph) return;
        setBreadcrumb({
          label: t('documentPreview.breadcrumbChapter', { preview: firstWords(stripSegmentTitleHtml(paragraph.segment_title ?? '')) }),
          onPress: () => navigateToRead({ sourceId: paragraph.source_id, segmentIndex: paragraph.segment_index, paragraphId: null }),
        });
      } else if (tier === 'source' && note.source_id) {
        const source = await SourceRepository.findById(note.source_id);
        if (cancelled || !source) return;
        setBreadcrumb({
          label: t('documentPreview.breadcrumbBook', { title: source.title }),
          onPress: () => navigateToRead({ sourceId: source.id, segmentIndex: null, paragraphId: null }),
        });
      } else {
        setBreadcrumb(null);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id, note?.paragraph_id, note?.segment_slug, note?.source_id, t]);

  return breadcrumb;
}

export default function DocumentPreviewOverlay({ note, onClose, onDeleted }: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const isDark = colorScheme === 'dark';
  const { height: windowHeight } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const breadcrumb = useNoteBreadcrumb(note);
  const badgeStyle = getNoteBadgeStyle(isDark);

  React.useEffect(() => {
    if (note) setCanUndo(documentUndoStack.peek()?.noteId === note.id);
  }, [note]);

  if (!note) return null;

  const handleUndo = async () => {
    const entry = documentUndoStack.pop();
    if (!entry || entry.noteId !== note.id) return;
    await NoteRepository.save(note.id, entry.previousContent, note.version);
    setCanUndo(false);
  };

  const handleDelete = () => {
    confirmDeleteNote(async () => {
      await NoteRepository.delete(note.id);
      onDeleted?.();
      onClose();
    });
  };

  return (
    <>
      <View style={overlayStyles.sheetLayer} pointerEvents="box-none">
        <Pressable style={overlayStyles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainer, maxHeight: Math.round(windowHeight * 0.65), minHeight: Math.round(windowHeight * 0.4) }]}>
          {breadcrumb && (
            <TouchableOpacity
              onPress={breadcrumb.onPress}
              style={[styles.breadcrumb, { backgroundColor: badgeStyle.backgroundColor }]}
              activeOpacity={0.8}
            >
              <Text style={[textStyles.noteMeta, { color: badgeStyle.textColor }]} numberOfLines={1}>
                {breadcrumb.label}
              </Text>
            </TouchableOpacity>
          )}
          <View style={styles.header}>
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, textTransform: 'none', flex: 1 }]} numberOfLines={1}>
              {extractDocumentTitle(note.content)}
            </Text>
            {canUndo && (
              <TouchableOpacity onPress={handleUndo} hitSlop={8} style={styles.iconBtn}>
                <AppIcon name={ICONS.arbeitstext.undo} size={ICON_SIZES.menu} color={colors.primary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={() => setEditing(true)} hitSlop={8} style={styles.iconBtn}>
              <AppIcon name={ICONS.arbeitstext.edit} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} hitSlop={8} style={styles.iconBtn}>
              <AppIcon name={ICONS.arbeitstext.delete} size={ICON_SIZES.menu} color={colors.error} />
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} hitSlop={8} style={styles.iconBtn}>
              <AppIcon name={ICONS.action.close} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <DocumentMarkdownView content={note.content} />
          </ScrollView>
        </View>
      </View>

      <NoteEditorModal
        visible={editing}
        onClose={() => setEditing(false)}
        note={note}
        contextLabel={t('common.editArbeitstext')}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.m,
    gap: spacing.s,
  },
  breadcrumb: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  iconBtn: { padding: spacing.xs },
  body: { flexGrow: 0 },
  bodyContent: { paddingBottom: spacing.xl },
});
