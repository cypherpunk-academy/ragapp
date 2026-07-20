import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, useWindowDimensions,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles, ICONS, ICON_SIZES, getNoteBadgeStyle } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import AppIcon from '@/shared/components/AppIcon';
import DocumentMarkdownView from '@/shared/components/DocumentMarkdownView';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { SourceRepository } from '@/data/repositories/SourceRepository';
import { TalkRepository } from '@/data/repositories/TalkRepository';
import { documentUndoStack } from '@/data/tools/documentUndoStack';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import { classifyOwnContextTier, firstWords } from '@/shared/lib/arbeitstextContext';
import { stripSegmentTitleHtml } from '@/shared/lib/segmentTitleDisplay';
import { confirmDeleteNote } from '@/shared/lib/confirmDeleteNote';
import { useReading } from '@/shared/contexts/ReadingContext';
import type Note from '@/data/db/models/Note';

type Props = {
  note: Note | null;
  onClose: () => void;
  /** Nur im Chat verfügbar (§ 6) — in der Bibliothek gibt es nichts zum Loslösen. */
  onDetach?: () => void;
  /** Nicht im Chat selbst — navigiert zum Chat-Tab und verknüpft die Note dort. */
  onEditInChat?: () => void;
  /** Aufgerufen nachdem die Note über das Löschen-Icon entfernt wurde. */
  onDeleted?: () => void;
};

type NoteBreadcrumb = { label: string; onPress: () => void };

/** Löst die Verknüpfungs-Herkunft einer Note auf (Gespräch/Absatz/Kapitel/Buch) — für den Header. */
function useNoteBreadcrumb(note: Note | null): NoteBreadcrumb | null {
  const { navigateToRead, navigateToChatWithTalk } = useReading();
  const [breadcrumb, setBreadcrumb] = useState<NoteBreadcrumb | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!note) {
      setBreadcrumb(null);
      return;
    }
    const tier = classifyOwnContextTier(note);

    (async () => {
      if (tier === 'paragraph' && note.paragraphId) {
        const paragraph = await ParagraphRepository.findById(note.paragraphId);
        if (cancelled || !paragraph) return;
        setBreadcrumb({
          label: `Absatz: ${firstWords(paragraph.textRaw)}`,
          onPress: () => navigateToRead({ sourceId: paragraph.sourceId, segmentIndex: paragraph.segmentIndex, paragraphId: paragraph.id }),
        });
      } else if (tier === 'segment' && note.sourceId && note.segmentSlug) {
        const paragraph = await ParagraphRepository.findFirstBySegmentSlug(note.sourceId, note.segmentSlug);
        if (cancelled || !paragraph) return;
        setBreadcrumb({
          label: `Kapitel: ${firstWords(stripSegmentTitleHtml(paragraph.segmentTitle))}`,
          onPress: () => navigateToRead({ sourceId: paragraph.sourceId, segmentIndex: paragraph.segmentIndex, paragraphId: null }),
        });
      } else if (tier === 'source' && note.sourceId) {
        const source = await SourceRepository.findById(note.sourceId);
        if (cancelled || !source) return;
        setBreadcrumb({
          label: `Buch: ${source.title}`,
          onPress: () => navigateToRead({ sourceId: source.id, segmentIndex: null, paragraphId: null }),
        });
      } else if (note.talkId) {
        const talk = await TalkRepository.findById(note.talkId);
        if (cancelled) return;
        setBreadcrumb({
          label: `Gespräch: ${firstWords(talk?.title ?? 'Gespräch')}`,
          onPress: () => navigateToChatWithTalk(note.talkId!),
        });
      } else {
        setBreadcrumb(null);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note?.id, note?.paragraphId, note?.segmentSlug, note?.sourceId, note?.talkId]);

  return breadcrumb;
}

/**
 * Preview-Overlay (Bottom Sheet, ~55–65 % Höhe): Verknüpfungs-Breadcrumb, gerendertes Markdown,
 * Undo/Bearbeiten/(Loslösen). Wird von Chat, Absatz, Kapitel und Buch gemeinsam genutzt.
 */
export default function DocumentPreviewOverlay({ note, onClose, onDetach, onEditInChat, onDeleted }: Props) {
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
    await NoteRepository.update(note, entry.previousContent);
    setCanUndo(false);
  };

  const handleDelete = () => {
    confirmDeleteNote(async () => {
      await NoteRepository.delete(note);
      onDeleted?.();
      onClose();
    });
  };

  const handleEditInChat = () => {
    onEditInChat?.();
    onClose();
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
            {onEditInChat && (
              <TouchableOpacity
                onPress={handleEditInChat}
                hitSlop={8}
                style={styles.iconBtn}
                accessibilityLabel="Mit Philo am Arbeitstext arbeiten"
              >
                <AppIcon name={ICONS.arbeitstext.editInChat} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
            {onDetach && (
              <TouchableOpacity onPress={onDetach} hitSlop={8} style={styles.iconBtn}>
                <AppIcon name={ICONS.arbeitstext.detach} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
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
        contextLabel="Arbeitstext bearbeiten"
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
