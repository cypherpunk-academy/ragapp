import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Alert, StyleSheet, useColorScheme,
} from 'react-native';
import { lightColors, darkColors, spacing, typography, ICONS, ICON_SIZES } from '@/shared/theme';
import AppIcon from '@/shared/components/AppIcon';
import ArbeitstextCard from '@/shared/components/ArbeitstextCard';
import DocumentPreviewOverlay from '@/shared/components/DocumentPreviewOverlay';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { ParagraphRepository } from '@/data/repositories/ParagraphRepository';
import { useReading } from '@/shared/contexts/ReadingContext';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import {
  ARBEITSTEXT_CONTEXT_TIER_LABELS, sortArbeitstexte, classifyArbeitstextContext,
  type ArbeitstextContextTier, type ArbeitstextReadingSnapshot,
} from '@/shared/lib/arbeitstextContext';
import type Note from '@/data/db/models/Note';

const TIER_ORDER: ArbeitstextContextTier[] = ['paragraph', 'segment', 'source', 'general'];

type Props = {
  /** Öffnet den Arbeitstext im Chat-Segment zum Weiterbearbeiten (§5.6). */
  onEditInChat?: (noteId: string) => void;
};

/**
 * ARBEITSTEXTE-Segment des Filo-Tabs — Bibliothek (Filter, Titelsuche, Vorschau).
 * Filo §5.4.
 */
export default function ArbeitstexteScreen({ onEditInChat }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { target } = useReading();

  const [notes, setNotes] = useState<Note[]>([]);
  const [reading, setReading] = useState<ArbeitstextReadingSnapshot | null>(null);
  const [activeTier, setActiveTier] = useState<ArbeitstextContextTier | null>(null);
  const [query, setQuery] = useState('');
  const [previewNote, setPreviewNote] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    const sub = NoteRepository.observeAll().subscribe(setNotes);
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    if (!target.paragraphId) {
      setReading(null);
      return;
    }
    let cancelled = false;
    ParagraphRepository.findById(target.paragraphId).then((paragraph) => {
      if (cancelled || !paragraph) return;
      setReading({
        sourceId: paragraph.sourceId,
        segmentSlug: paragraph.segmentSlug ?? '',
        paragraphId: paragraph.id,
      });
    });
    return () => { cancelled = true; };
  }, [target.paragraphId]);

  const visibleNotes = useMemo(() => {
    const sorted = sortArbeitstexte(notes, reading, activeTier);
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((n) => extractDocumentTitle(n.content).toLowerCase().includes(q));
  }, [notes, reading, activeTier, query]);

  const handleCardPress = (note: Note) => {
    Alert.alert(
      extractDocumentTitle(note.content),
      undefined,
      [
        { text: 'Vorschau', onPress: () => setPreviewNote(note) },
        ...(onEditInChat ? [{ text: 'In Gespräch bearbeiten', onPress: () => onEditInChat(note.id) }] : []),
        { text: 'Abbrechen', style: 'cancel' as const },
      ],
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.filterRow}>
        {TIER_ORDER.map((tier) => {
          const isActive = activeTier === tier;
          const disabled = !reading && (tier === 'paragraph' || tier === 'segment');
          return (
            <TouchableOpacity
              key={tier}
              disabled={disabled}
              onPress={() => setActiveTier(isActive ? null : tier)}
              style={[
                styles.chip,
                {
                  borderColor: isActive ? colors.primary : colors.outlineVariant,
                  backgroundColor: isActive ? colors.primaryContainer : 'transparent',
                  opacity: disabled ? 0.4 : 1,
                },
              ]}
            >
              <Text style={[typography.labelMedium, { color: isActive ? colors.onPrimaryContainer : colors.onSurfaceVariant }]}>
                {ARBEITSTEXT_CONTEXT_TIER_LABELS[tier]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={[styles.searchRow, { borderColor: colors.outlineVariant }]}>
        <AppIcon name={ICONS.tab.search} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
        <TextInput
          style={[typography.bodyMedium, styles.searchInput, { color: colors.onSurface }]}
          placeholder="Titel durchsuchen…"
          placeholderTextColor={colors.outline}
          value={query}
          onChangeText={setQuery}
        />
        <TouchableOpacity onPress={() => setCreating(true)} hitSlop={8}>
          <AppIcon name={ICONS.arbeitstext.attach} size={ICON_SIZES.menu} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={visibleNotes}
        keyExtractor={(n) => n.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <ArbeitstextCard
            note={item}
            tier={classifyArbeitstextContext(item, reading)}
            onPress={() => handleCardPress(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.xl }]}>
            Keine Arbeitstexte.
          </Text>
        }
      />

      <DocumentPreviewOverlay note={previewNote} onClose={() => setPreviewNote(null)} />

      <NoteEditorModal
        visible={creating}
        onClose={() => setCreating(false)}
        contextLabel="Neuer Arbeitstext"
        paragraphId={reading?.paragraphId}
        segmentSlug={reading?.segmentSlug}
        sourceId={reading?.sourceId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  filterRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs,
    paddingHorizontal: spacing.m, paddingTop: spacing.s,
  },
  chip: {
    paddingVertical: spacing.xs, paddingHorizontal: spacing.s,
    borderRadius: 16, borderWidth: StyleSheet.hairlineWidth,
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    marginHorizontal: spacing.m, marginVertical: spacing.s,
    paddingHorizontal: spacing.s, paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 8,
  },
  searchInput: { flex: 1, paddingVertical: 0 },
  listContent: { paddingHorizontal: spacing.m, paddingBottom: spacing.xl, gap: spacing.s },
});
