import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, useColorScheme,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles, typography, ICONS, ICON_SIZES, getNoteBadgeStyle } from '@/shared/theme';
import AppIcon from '@/shared/components/AppIcon';
import DocumentMarkdownView from '@/shared/components/DocumentMarkdownView';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { documentUndoStack } from '@/data/tools/documentUndoStack';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import { confirmDeleteNote } from '@/shared/lib/confirmDeleteNote';
import type Note from '@/data/db/models/Note';

type Props = {
  userId: string;
  note: Note | null;
  activeTalkId: string | null;
  onDeleted?: () => void;
};

export default function ArbeitstextTab({ userId, note, activeTalkId, onDeleted }: Props) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const badgeStyle = getNoteBadgeStyle(isDark);
  const [editing, setEditing] = useState(false);
  const [canUndo, setCanUndo] = useState(false);

  useEffect(() => {
    setCanUndo(note ? documentUndoStack.peek()?.noteId === note.id : false);
  }, [note]);

  const handleUndo = async () => {
    if (!note) return;
    const entry = documentUndoStack.pop();
    if (!entry || entry.noteId !== note.id) return;
    await NoteRepository.update(note, entry.previousContent);
    setCanUndo(false);
  };

  const handleDelete = () => {
    if (!note) return;
    confirmDeleteNote(async () => {
      await NoteRepository.delete(note);
      onDeleted?.();
    });
  };

  if (!note) {
    return (
      <View style={styles.empty}>
        <AppIcon name={ICONS.arbeitstext.attach} size={40} color={colors.onSurfaceVariant} />
        <Text style={[typography.titleMedium, styles.emptyTitle, { color: colors.onSurface }]}>
          Kein Arbeitstext verknüpft
        </Text>
        <Text style={[typography.bodyMedium, styles.emptyBody, { color: colors.onSurfaceVariant }]}>
          Verknüpfe im Chat einen Arbeitstext, um ihn hier zu bearbeiten.
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <View style={[styles.titleBadge, { backgroundColor: badgeStyle.backgroundColor }]}>
          <Text style={[textStyles.noteMeta, { color: badgeStyle.textColor }]} numberOfLines={1}>
            {extractDocumentTitle(note.content)}
          </Text>
        </View>
        <View style={styles.actions}>
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
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        <DocumentMarkdownView content={note.content} />
      </ScrollView>

      <NoteEditorModal
        visible={editing}
        onClose={() => setEditing(false)}
        userId={userId}
        note={note}
        talkId={activeTalkId}
        contextLabel="Arbeitstext bearbeiten"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  titleBadge: {
    flex: 1,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: 6,
    minWidth: 0,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  iconBtn: { padding: spacing.xs },
  body: { flex: 1 },
  bodyContent: { padding: spacing.m, paddingBottom: spacing.xl },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.m,
  },
  emptyTitle: { textAlign: 'center', marginTop: spacing.s },
  emptyBody: { textAlign: 'center', maxWidth: 300 },
});
