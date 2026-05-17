import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightColors, darkColors, spacing, typography } from '../../theme';
import { NoteRepository } from '../../repositories/NoteRepository';
import NoteEditorModal from '../../components/NoteEditorModal';
import type Note from '../../db/models/Note';
import type Paragraph from '../../db/models/Paragraph';

export type ContributionsTab = 'notes' | 'conversations' | 'rag';

const TABS: { id: ContributionsTab; label: string }[] = [
  { id: 'notes', label: 'Notizen' },
  { id: 'conversations', label: 'Gespräche' },
  { id: 'rag', label: 'RAG-Treffer' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  paragraph: Paragraph | null;
  sourceId: string;
  initialTab?: ContributionsTab;
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ContributionsScreen({
  visible, onClose, paragraph, sourceId, initialTab = 'notes',
}: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ContributionsTab>(initialTab);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);

  useEffect(() => {
    if (visible) setActiveTab(initialTab);
  }, [visible, initialTab]);

  useEffect(() => {
    if (!paragraph || !visible) {
      setNotes([]);
      return;
    }
    let cancelled = false;
    NoteRepository.findByParagraph(paragraph.paragraphId).then((list) => {
      if (!cancelled) setNotes(list);
    });
    const sub = NoteRepository.observeBySource(sourceId).subscribe(async () => {
      const list = await NoteRepository.findByParagraph(paragraph.paragraphId);
      if (!cancelled) setNotes(list);
    });
    return () => { cancelled = true; sub.unsubscribe(); };
  }, [paragraph, sourceId, visible]);

  const contextLabel = useMemo(() => {
    if (!paragraph) return null;
    const typeLabel = paragraph.segmentType === 'preface' ? 'Vorwort' : 'Kapitel';
    return `Absatz ${paragraph.paragraphNumber} · ${typeLabel} ${paragraph.segmentTitle}`;
  }, [paragraph]);

  const handleEdit = (note: Note) => {
    setEditNote(note);
    setEditorOpen(true);
  };

  const handleDelete = async (note: Note) => {
    await NoteRepository.delete(note);
  };

  if (!paragraph) return null;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={[styles.appBar, { borderBottomColor: colors.outlineVariant }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
          </TouchableOpacity>
          <Text style={[typography.titleMedium, { color: colors.onBackground, flex: 1 }]} numberOfLines={1}>
            Beiträge
          </Text>
        </View>

        <View style={[styles.tabRow, { borderBottomColor: colors.outlineVariant }]}>
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <TouchableOpacity
                key={tab.id}
                style={styles.tab}
                onPress={() => setActiveTab(tab.id)}
              >
                <Text style={[typography.labelLarge, { color: active ? colors.primary : colors.onSurfaceVariant }]}>
                  {tab.label}
                </Text>
                {active && <View style={[styles.tabUnderline, { backgroundColor: colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {activeTab === 'notes' && (
            <>
              {notes.length === 0 && (
                <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.l }]}>
                  Noch keine Notizen zu diesem Absatz.
                </Text>
              )}
              {notes.map((note) => (
                <View key={note.id} style={[styles.noteCard, { backgroundColor: colors.surfaceContainer }]}>
                  <View style={styles.noteCardHeader}>
                    <Text style={[typography.labelSmall, { color: colors.onSurfaceVariant }]}>
                      {formatDate(note.createdAt)}
                    </Text>
                    <View style={styles.noteActions}>
                      <TouchableOpacity onPress={() => handleEdit(note)} hitSlop={8}>
                        <Ionicons name="pencil" size={18} color={colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleDelete(note)} hitSlop={8}>
                        <Ionicons name="close" size={18} color={colors.onSurfaceVariant} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>{note.content}</Text>
                </View>
              ))}
            </>
          )}
          {activeTab === 'conversations' && (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.l }]}>
              Noch keine Gespräche.
            </Text>
          )}
          {activeTab === 'rag' && (
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.l }]}>
              Noch keine RAG-Treffer.
            </Text>
          )}
        </ScrollView>
      </View>

      <NoteEditorModal
        visible={editorOpen}
        onClose={() => { setEditorOpen(false); setEditNote(null); }}
        note={editNote}
        contextLabel={contextLabel}
        onDeleted={() => { setEditorOpen(false); setEditNote(null); }}
      />
    </Modal>
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
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.s,
    gap: 4,
  },
  tabUnderline: { height: 2, width: '60%', borderRadius: 1 },
  content: { padding: spacing.m, gap: spacing.m },
  noteCard: { borderRadius: 12, padding: spacing.m, gap: spacing.xs },
  noteCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  noteActions: { flexDirection: 'row', gap: spacing.m },
});
