import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Pressable, StyleSheet, useColorScheme, useWindowDimensions,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles, ICONS, ICON_SIZES } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import AppIcon from '@/shared/components/AppIcon';
import DocumentMarkdownView from '@/shared/components/DocumentMarkdownView';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { documentUndoStack } from '@/data/tools/documentUndoStack';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import type Note from '@/data/db/models/Note';

type Props = {
  note: Note | null;
  onClose: () => void;
  /** Nur im Chat verfügbar (§ 6) — in der Bibliothek gibt es nichts zum Loslösen. */
  onDetach?: () => void;
};

/**
 * Preview-Overlay (Bottom Sheet, ~55–65 % Höhe): gerendertes Markdown, Undo/Bearbeiten/(Loslösen).
 * Filo §5.4 (Bibliothek → Vorschau) und §6 (Chat → Arbeitstext-Chip).
 */
export default function DocumentPreviewOverlay({ note, onClose, onDetach }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { height: windowHeight } = useWindowDimensions();
  const [editing, setEditing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

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

  return (
    <>
      <View style={overlayStyles.sheetLayer} pointerEvents="box-none">
        <Pressable style={overlayStyles.sheetBackdrop} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainer, maxHeight: Math.round(windowHeight * 0.65), minHeight: Math.round(windowHeight * 0.4) }]}>
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
            {onDetach && (
              <TouchableOpacity onPress={onDetach} hitSlop={8} style={styles.iconBtn}>
                <AppIcon name={ICONS.arbeitstext.detach} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.s },
  iconBtn: { padding: spacing.xs },
  body: { flexGrow: 0 },
  bodyContent: { paddingBottom: spacing.xl },
});
