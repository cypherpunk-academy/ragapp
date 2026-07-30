import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Platform, Pressable,
  StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, useWindowDimensions,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles } from '../theme';
import { overlayStyles } from '../styles/overlays';
import { useContentScale, scaleContentStyle } from '../hooks/useContentScale';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { confirmDeleteNote } from '@/shared/lib/confirmDeleteNote';
import { alertParagraphOccupied } from '@/shared/lib/paragraphOccupiedAlert';
import type Note from '@/data/db/models/Note';

type Props = {
  visible: boolean;
  onClose: () => void;
  userId: string;
  /** Label shown above the input, e.g. “Absatz 3 · Kapitel I” */
  contextLabel?: string | null;
  paragraphId?: string | null;
  segmentSlug?: string | null;
  sourceId?: string | null;
  talkId?: string | null;
  /** Pre-existing note to edit (omit for new note) */
  note?: Note | null;
  /** Vorbelegter Inhalt für neue Arbeitstexte, z. B. eine kontextuelle „# …”-Überschrift. */
  initialContent?: string;
  /** Feuert nach dem Anlegen eines neuen Arbeitstexts (nicht beim Bearbeiten). */
  onCreated?: (note: Note) => void;
  /** Vorhandener Absatz-Arbeitstext — z. B. Vorschau öffnen statt neu anlegen. */
  onOpenExisting?: (note: Note) => void;
  onDeleted?: () => void;
};

export default function NoteEditorModal({
  visible, onClose, userId, contextLabel, paragraphId, segmentSlug, sourceId, talkId, note, initialContent, onCreated, onOpenExisting, onDeleted,
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const scaledNoteBody = scaleContentStyle(textStyles.noteBody, useContentScale());
  const { height: windowHeight } = useWindowDimensions();
  const inputMaxHeight = Math.round(windowHeight * 0.45);
  const [content, setContent] = useState('');

  useEffect(() => {
    if (visible) setContent(note?.content ?? initialContent ?? '');
  }, [visible, note, initialContent]);

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) { onClose(); return; }
    if (note) {
      await NoteRepository.update(note, trimmed);
    } else {
      const result = await NoteRepository.create({
        userId,
        paragraphId: paragraphId ?? undefined,
        segmentSlug: segmentSlug ?? undefined,
        sourceId: sourceId ?? undefined,
        talkId: talkId ?? undefined,
        content: trimmed,
      });
      if (!result.ok) {
        alertParagraphOccupied(result.existingNote, {
          onOpen: onOpenExisting
            ? (existing) => {
                onOpenExisting(existing);
                onClose();
              }
            : undefined,
        });
        return;
      }
      onCreated?.(result.note);
    }
    onClose();
  };

  const handleDelete = () => {
    if (!note) return;
    confirmDeleteNote(async () => {
      await NoteRepository.delete(note);
      onDeleted?.();
      onClose();
    });
  };

  if (!visible) return null;

  const label = contextLabel ?? (note ? 'Arbeitstext bearbeiten' : 'Neuer Arbeitstext');

  return (
    <View style={overlayStyles.sheetLayer} pointerEvents="box-none">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, marginBottom: spacing.xs, textTransform: 'none' }]}>
            {label}
          </Text>
          <TextInput
            style={[
              scaledNoteBody,
              styles.input,
              {
                color: colors.onSurface,
                borderColor: colors.outlineVariant,
                backgroundColor: colors.surfaceContainerLow,
                maxHeight: inputMaxHeight,
              },
            ]}
            multiline
            scrollEnabled
            textAlignVertical="top"
            autoFocus
            placeholder="Arbeitstext eingeben..."
            placeholderTextColor={colors.outline}
            value={content}
            onChangeText={setContent}
          />
          <View style={styles.actions}>
            {note && (
              <TouchableOpacity style={styles.btnDestructive} onPress={handleDelete}>
                <Text style={[textStyles.contributionsTab, { color: colors.error }]}>Löschen</Text>
              </TouchableOpacity>
            )}
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant }]}>Abbrechen</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnFilled, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={[textStyles.contributionsTab, { color: colors.onPrimary }]}>Speichern</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.m,
    paddingBottom: spacing.xl,
    gap: spacing.s,
  },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    padding: spacing.s,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginTop: spacing.xs,
  },
  spacer: { flex: 1 },
  btn: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.m,
    borderRadius: 20,
  },
  btnFilled: {},
  btnDestructive: {
    paddingVertical: spacing.s,
    paddingHorizontal: spacing.s,
  },
});
