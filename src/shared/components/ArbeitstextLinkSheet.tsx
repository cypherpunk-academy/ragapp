import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList, Pressable, StyleSheet, useColorScheme,
} from 'react-native';
import { lightColors, darkColors, spacing, textStyles, typography, ICONS, ICON_SIZES } from '@/shared/theme';
import { overlayStyles } from '@/shared/styles/overlays';
import AppIcon from '@/shared/components/AppIcon';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import { formatRelativeTime } from '@/shared/lib/relativeTime';
import type Note from '@/data/db/models/Note';

const LOCAL_USER = 'local';

type Props = {
  visible: boolean;
  onClose: () => void;
  onLink: (note: Note) => void;
  talkId?: string | null;
};

/**
 * Header-📎-Sheet (Filo §6): Suche + "Neuen Arbeitstext anlegen" + zuletzt bearbeitete Liste.
 */
export default function ArbeitstextLinkSheet({ visible, onClose, onLink, talkId }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [notes, setNotes] = useState<Note[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!visible) return;
    const sub = NoteRepository.observeAll().subscribe(setNotes);
    return () => sub.unsubscribe();
  }, [visible]);

  const filtered = useMemo(() => {
    const sorted = [...notes].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((n) => extractDocumentTitle(n.content).toLowerCase().includes(q));
  }, [notes, query]);

  const handleCreate = async () => {
    const note = await NoteRepository.create({
      userId: LOCAL_USER,
      talkId: talkId ?? undefined,
      content: '# Neuer Arbeitstext\n',
    });
    onLink(note);
  };

  if (!visible) return null;

  return (
    <View style={overlayStyles.sheetLayer} pointerEvents="box-none">
      <Pressable style={overlayStyles.sheetBackdrop} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: colors.surfaceContainer }]}>
        <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, textTransform: 'none' }]}>
          Arbeitstext verknüpfen
        </Text>
        <View style={[styles.searchRow, { borderColor: colors.outlineVariant }]}>
          <AppIcon name={ICONS.tab.search} size={ICON_SIZES.menu} color={colors.onSurfaceVariant} />
          <TextInput
            style={[typography.bodyMedium, styles.searchInput, { color: colors.onSurface }]}
            placeholder="Titel durchsuchen…"
            placeholderTextColor={colors.outline}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity style={styles.createRow} onPress={handleCreate}>
          <AppIcon name={ICONS.arbeitstext.attach} size={ICON_SIZES.menu} color={colors.primary} />
          <Text style={[typography.bodyMedium, { color: colors.primary }]}>Neuen Arbeitstext anlegen</Text>
        </TouchableOpacity>
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          style={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} onPress={() => onLink(item)}>
              <Text style={[typography.bodyMedium, { color: colors.onSurface, flex: 1 }]} numberOfLines={1}>
                {extractDocumentTitle(item.content)}
              </Text>
              <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]}>
                {formatRelativeTime(item.updatedAt)}
              </Text>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.m }]}>
              Keine Arbeitstexte gefunden.
            </Text>
          }
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.m,
    gap: spacing.s,
    maxHeight: '70%',
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.xs,
    paddingHorizontal: spacing.s, paddingVertical: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth, borderRadius: 8,
  },
  searchInput: { flex: 1, paddingVertical: 0 },
  createRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.s },
  list: { flexGrow: 0 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.s, gap: spacing.s },
});
