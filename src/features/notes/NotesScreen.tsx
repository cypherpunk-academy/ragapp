import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import type Note from '@/data/db/models/Note';
import type Paragraph from '@/data/db/models/Paragraph';

const SOURCE_ID = 'philosophie-der-freiheit';

type SegmentMeta = { segmentIndex: number; segmentTitle: string; segmentType: string };

/** Parses segmentIndex out of paragraphId ("source:segmentIndex:paragraphNumber") */
function segmentIndexFromParagraphId(paragraphId: string | null): number | null {
  if (!paragraphId) return null;
  const parts = paragraphId.split(':');
  if (parts.length < 3) return null;
  const idx = parseInt(parts[1], 10);
  return isNaN(idx) ? null : idx;
}

function paragraphNumberFromId(paragraphId: string | null): number | null {
  if (!paragraphId) return null;
  const parts = paragraphId.split(':');
  if (parts.length < 3) return null;
  const n = parseInt(parts[2], 10);
  return isNaN(n) ? null : n;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export default function NotesScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const [notes, setNotes] = useState<Note[]>([]);
  const [paragraphs, setParagraphs] = useState<Paragraph[]>([]);
  const [loading, setLoading] = useState(true);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    const sub = NoteRepository.observeBySource(SOURCE_ID).subscribe((ns) => {
      setNotes(ns);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = ParagraphRepository.observeBySource(SOURCE_ID).subscribe(setParagraphs);
    return () => sub.unsubscribe();
  }, []);

  // Build segment metadata map
  const segmentMap = useMemo<Map<number, SegmentMeta>>(() => {
    const m = new Map<number, SegmentMeta>();
    for (const p of paragraphs) {
      if (!m.has(p.segmentIndex)) {
        m.set(p.segmentIndex, {
          segmentIndex: p.segmentIndex,
          segmentTitle: p.segmentTitle,
          segmentType: p.segmentType,
        });
      }
    }
    return m;
  }, [paragraphs]);

  // Group notes by segmentIndex (null = freie Notiz)
  const grouped = useMemo(() => {
    const map = new Map<number | null, Note[]>();
    for (const note of notes) {
      const segIdx = segmentIndexFromParagraphId(note.paragraphId);
      const key = segIdx;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(note);
    }
    // Sort groups: numbered segments ascending, then null at end
    const entries = Array.from(map.entries()).sort(([a], [b]) => {
      if (a === null) return 1;
      if (b === null) return -1;
      return a - b;
    });
    return entries;
  }, [notes]);

  const handleEdit = (note: Note) => {
    setEditNote(note);
    setEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setEditorOpen(false);
    setEditNote(null);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const typeLabel = (type: string) => type === 'preface' ? 'Vorwort' : 'Kapitel';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.titleLarge, { color: colors.onBackground }]}>Notizen</Text>

        {notes.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="pencil-outline" size={32} color={colors.onSurfaceVariant} style={{ marginBottom: spacing.s }} />
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
              Noch keine Notizen.{'\n'}Halte im Lesen-Tab einen Absatz gedrückt.
            </Text>
          </View>
        )}

        {grouped.map(([segIdx, segNotes]) => {
          const meta = segIdx !== null ? segmentMap.get(segIdx) : null;
          return (
            <View key={segIdx ?? 'free'} style={styles.group}>
              {/* Segment-Header */}
              <View style={styles.groupHeader}>
                {meta ? (
                  <>
                    <Text style={[typography.labelSmall, { color: colors.primary }]}>
                      {typeLabel(meta.segmentType)}
                    </Text>
                    <Text style={[typography.titleSmall, { color: colors.onBackground }]}>
                      {meta.segmentTitle}
                    </Text>
                  </>
                ) : (
                  <Text style={[typography.titleSmall, { color: colors.onBackground }]}>Freie Notizen</Text>
                )}
              </View>

              {/* Notiz-Karten */}
              <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
                {segNotes.map((note, i) => {
                  const paraNum = paragraphNumberFromId(note.paragraphId);
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
                              Absatz {paraNum}
                            </Text>
                          )}
                          <Text
                            style={[typography.bodyMedium, { color: colors.onSurface }]}
                            numberOfLines={3}
                          >
                            {note.content}
                          </Text>
                          <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                            {formatDate(note.createdAt)}
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

      {/* Editor Modal */}
      <NoteEditorModal
        visible={editorOpen}
        onClose={handleCloseEditor}
        onDeleted={handleCloseEditor}
        note={editNote}
        contextLabel={
          editNote?.paragraphId
            ? (() => {
                const segIdx = segmentIndexFromParagraphId(editNote.paragraphId);
                const meta = segIdx !== null ? segmentMap.get(segIdx) : null;
                const paraNum = paragraphNumberFromId(editNote.paragraphId);
                return paraNum !== null && meta
                  ? `Absatz ${paraNum} · ${meta.segmentTitle}`
                  : 'Notiz bearbeiten';
              })()
            : 'Notiz bearbeiten'
        }
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
