import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView, Keyboard, Platform, Pressable,
  StyleSheet, Text, TextInput, TouchableOpacity, View, useColorScheme, useWindowDimensions,
} from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { lightColors, darkColors, spacing, textStyles } from '../theme';
import { overlayStyles } from '../styles/overlays';
import { useContentScale, scaleContentStyle } from '../hooks/useContentScale';
import { NoteRepository, type NoteRow } from '@/data/repositories/NoteRepository';
import { confirmDeleteNote } from '@/shared/lib/confirmDeleteNote';
import { alertParagraphOccupied } from '@/shared/lib/paragraphOccupiedAlert';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Label shown above the input, e.g. "Absatz 3 · Kapitel I" */
  contextLabel?: string | null;
  paragraphId?: string | null;
  sourceId?: string | null;
  /** Pre-existing note to edit (omit for new note) */
  note?: NoteRow | null;
  /** Vorbelegter Inhalt für neue Arbeitstexte, z. B. eine kontextuelle "# …"-Überschrift. */
  initialContent?: string;
  /** Feuert nach dem Anlegen eines neuen Arbeitstexts (nicht beim Bearbeiten). */
  onCreated?: (note: NoteRow) => void;
  /** Vorhandener Absatz-Arbeitstext — z. B. Vorschau öffnen statt neu anlegen. */
  onOpenExisting?: (note: NoteRow) => void;
  onDeleted?: () => void;
};

export default function NoteEditorModal({
  visible, onClose, contextLabel, paragraphId, sourceId, note, initialContent, onCreated, onOpenExisting, onDeleted,
}: Props) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const scaledNoteBody = scaleContentStyle(textStyles.noteBody, useContentScale());
  const { height: windowHeight } = useWindowDimensions();
  const inputMaxHeight = Math.round(windowHeight * 0.45);
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');

  useEffect(() => {
    if (visible) {
      setContent(note?.content ?? initialContent ?? '');
      setSaveStatus('idle');
    }
  }, [visible, note, initialContent]);

  const handleSave = async () => {
    const trimmed = content.trim();
    if (!trimmed) { onClose(); return; }
    setSaveStatus('saving');
    try {
      if (note) {
        const result = await NoteRepository.save(note.id, trimmed, note.version);
        if ('conflict' in result && result.conflict) {
          setSaveStatus('error');
          return;
        }
        if ('error' in result) {
          setSaveStatus('error');
          return;
        }
        setSaveStatus('saved');
      } else {
        // Check if paragraph already has a note
        if (paragraphId) {
          const existing = await NoteRepository.list({ paragraphId });
          if (existing.length > 0) {
            alertParagraphOccupied(existing[0], {
              onOpen: onOpenExisting
                ? (ex) => { onOpenExisting(ex); onClose(); }
                : undefined,
            });
            setSaveStatus('idle');
            return;
          }
        }
        const result = await NoteRepository.create({
          title: '',
          content: trimmed,
          paragraphId: paragraphId ?? undefined,
        });
        if ('error' in result) {
          setSaveStatus('error');
          return;
        }
        setSaveStatus('saved');
        const created = await NoteRepository.get(result.id);
        if (created) onCreated?.(created);
      }
      onClose();
    } catch {
      setSaveStatus('error');
    }
  };

  const handleDelete = () => {
    if (!note) return;
    confirmDeleteNote(async () => {
      await NoteRepository.delete(note.id);
      onDeleted?.();
      onClose();
    });
  };

  const noteKeyboard = useAnimatedKeyboard({ isStatusBarTranslucentAndroid: true });
  const noteKbFallback = useSharedValue(0);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', (e) => {
      noteKbFallback.value = e.endCoordinates.height;
    });
    const hide = Keyboard.addListener('keyboardDidHide', () => {
      noteKbFallback.value = 0;
    });
    return () => { show.remove(); hide.remove(); };
  }, []);
  const noteKbStyle = useAnimatedStyle(() => {
    if (Platform.OS !== 'android') return { flex: 1, justifyContent: 'flex-end' as const };
    const kb = Math.max(noteKeyboard.height.value, noteKbFallback.value);
    return { flex: 1, justifyContent: 'flex-end' as const, paddingBottom: kb > 0 ? kb - insets.bottom : 0 };
  });

  if (!visible) return null;

  const label = contextLabel ?? (note ? t('common.editArbeitstext') : t('common.newArbeitstext'));
  const statusLabel = saveStatus === 'saving' ? t('noteEditor.saving')
    : saveStatus === 'error' ? t('noteEditor.error')
    : null;

  return (
    <View style={overlayStyles.sheetLayer} pointerEvents="box-none">
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={noteKbStyle}>
        <Pressable style={styles.overlay} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surfaceContainer }]}>
          <View style={styles.headerRow}>
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, textTransform: 'none', flex: 1 }]}>
              {label}
            </Text>
            {statusLabel && (
              <Text style={[textStyles.contributionsBreadcrumb, { color: saveStatus === 'error' ? colors.error : colors.onSurfaceVariant }]}>
                {statusLabel}
              </Text>
            )}
            {note && (
              <Text style={[textStyles.contributionsBreadcrumb, { color: colors.outline }]}>
                v{note.version}
              </Text>
            )}
          </View>
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
            placeholder={t('noteEditor.placeholder')}
            placeholderTextColor={colors.outline}
            value={content}
            onChangeText={setContent}
          />
          <View style={styles.actions}>
            {note && (
              <TouchableOpacity style={styles.btnDestructive} onPress={handleDelete}>
                <Text style={[textStyles.contributionsTab, { color: colors.error }]}>{t('common.delete')}</Text>
              </TouchableOpacity>
            )}
            <View style={styles.spacer} />
            <TouchableOpacity style={styles.btn} onPress={onClose}>
              <Text style={[textStyles.contributionsTab, { color: colors.onSurfaceVariant }]}>{t('common.cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnFilled, { backgroundColor: colors.primary }]}
              onPress={handleSave}
              disabled={saveStatus === 'saving'}
            >
              <Text style={[textStyles.contributionsTab, { color: colors.onPrimary }]}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        </View>
        </Animated.View>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    marginBottom: spacing.xs,
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
