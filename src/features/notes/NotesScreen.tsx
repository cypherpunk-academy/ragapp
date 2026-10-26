import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography, textStyles } from '@/shared/theme';
import { NoteRepository, type NoteRow } from '@/data/repositories/NoteRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import {
  buildParagraphById,
  buildSegmentMap,
  noteParagraphNumber,
  noteSegmentSlug,
  type SegmentMeta,
} from '@/shared/lib/noteContext';
import type { Paragraph } from '@/data/repositories/ParagraphRepository';
import { getDateLocale } from '@/shared/i18n';

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(getDateLocale(), { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function NotesScreen({ sourceId }: { sourceId: string }) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [editNote, setEditNote] = useState<NoteRow | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  const loadNotes = useCallback(async () => {
    try {
      const ns = await NoteRepository.list({ sourceId });
      setNotes(ns);
    } catch { /* offline */ }
    setLoading(false);
  }, [sourceId]);

  useEffect(() => { void loadNotes(); }, [loadNotes]);

  useEffect(() => {
    void ParagraphRepository.findBySource(sourceId).then(setParagraphs);
  }, [sourceId]);

  const paragraphById = useMemo(() => buildParagraphById(paragraphs), [paragraphs]);
  const segmentMap = useMemo(() => buildSegmentMap(paragraphs), [paragraphs]);

  const grouped = useMemo(() => {
    const map = new Map<string | null, NoteRow[]>();
    for (const note of notes) {
      const slug = noteSegmentSlug(note, paragraphById);
      if (!map.has(slug)) map.set(slug, []);
      map.get(slug)!.push(note);
    }
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      const metaA = segmentMap.get(a);
      const metaB = segmentMap.get(b);
      return (metaA?.segmentIndex ?? 0) - (metaB?.segmentIndex ?? 0);
    });
    return entries;
  }, [notes, paragraphById, segmentMap]);

  const handleEdit = (note: NoteRow) => {
    setEditNote(note);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditNote(null);
    void loadNotes();
  };

  const contextLabelForNote = (note: NoteRow): string => {
    const slug = noteSegmentSlug(note, paragraphById);
    const meta = slug ? segmentMap.get(slug) : null;
    const paraNum = noteParagraphNumber(note, paragraphById);
    if (paraNum !== null && meta) {
      return t('common.paragraphNumberDotTitle', { number: paraNum, title: meta.segmentTitle });
    }
    return t('common.editNote');
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const typeLabel = t('common.chapter');

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.titleLarge, { color: colors.onBackground }]}>{t('notes.title')}</Text>

        {notes.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="pencil-outline" size={32} color={colors.onSurfaceVariant} style={{ marginBottom: spacing.s }} />
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              {t('notes.empty')}
            </Text>
          </View>
        )}

        {grouped.map(([segmentSlug, segNotes]) => {
          const meta: SegmentMeta | undefined = segmentSlug ? segmentMap.get(segmentSlug) : undefined;
          return (
            <View key={segmentSlug ?? 'free'} style={styles.group}>
              <View style={styles.groupHeader}>
                {meta ? (
                  <>
                    <Text style={[typography.labelSmall, { color: colors.primary }]}>
                      {typeLabel}
                    </Text>
                    <Text style={[typography.titleSmall, { color: colors.onBackground }]}>
                      {meta.segmentTitle}
                    </Text>
                  </>
                ) : (
                  <Text style={[typography.titleSmall, { color: colors.onBackground }]}>{t('notes.freeNotes')}</Text>
                )}
              </View>

              <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
                {segNotes.map((note, i) => {
                  const paraNum = noteParagraphNumber(note, paragraphById);
                  return (
                    <React.Fragment key={note.id}>
                      {i > 0 && <View style={[styles.divider, { backgroundColor: colors.outlineVariant }]} />}
                      <TouchableOpacity
                        style={styles.noteRow}
                        onPress={() => handleEdit(note)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.noteContent}>
                          {paraNum !== null && (
                            <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                              {t('common.paragraphNumber', { number: paraNum })}
                            </Text>
                          )}
                          <Text
                            style={[textStyles.noteBody, { color: colors.onSurface }]}
                            numberOfLines={3}
                          >
                            {note.content}
                          </Text>
                          <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                            {formatDate(note.created_at)}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      <NoteEditorModal
        visible={editorOpen}
        onClose={handleCloseEditor}
        onDeleted={handleCloseEditor}
        note={editNote}
        contextLabel={editNote ? contextLabelForNote(editNote) : t('common.editNote')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.m, gap: spacing.m },
  emptyCard: {
    borderRadius: 12,
    padding: spacing.l,
    alignItems: 'center',
    marginTop: spacing.s,
  },
  group: { gap: spacing.xs },
  groupHeader: { paddingHorizontal: spacing.xs, gap: 2 },
  card: { borderRadius: 12, overflow: 'hidden' },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: spacing.m },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    gap: spacing.m,
  },
  noteContent: { flex: 1, gap: 2 },
});
