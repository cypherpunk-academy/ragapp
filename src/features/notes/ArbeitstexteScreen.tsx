import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, useColorScheme, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography, textStyles } from '@/shared/theme';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import NoteEditorModal from '@/shared/components/NoteEditorModal';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import type Note from '@/data/db/models/Note';

function formatDate(date: Date): string {
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** Bibliothek allgemeiner Arbeitstexte (ohne Buch-/Kapitel-/Absatz-Verknüpfung). */
export default function ArbeitstexteScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [editNote, setEditNote] = useState<Note | null>(null);

  useEffect(() => {
    const sub = NoteRepository.observeGeneral().subscribe((ns) => {
      setNotes(ns);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return notes;
    return notes.filter((n) =>
      extractDocumentTitle(n.content).toLowerCase().includes(q),
    );
  }, [notes, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* AppBar */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={[typography.titleMedium, { color: colors.onSurface, flex: 1, marginLeft: spacing.s }]}>
          Arbeitstexte
        </Text>
      </View>

      {/* Suchleiste */}
      <View style={[styles.searchWrap, { backgroundColor: colors.background }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
          <Ionicons name="search" size={18} color={colors.onSurfaceVariant} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Arbeitstext suchen…"
            placeholderTextColor={colors.onSurfaceVariant}
            style={[typography.bodyMedium, styles.searchInput, { color: colors.onSurface }]}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            {searchQuery ? 'Kein Arbeitstext gefunden.' : 'Noch keine allgemeinen Arbeitstexte vorhanden.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.surfaceContainerLow }]}
              onPress={() => setEditNote(item)}
              activeOpacity={0.7}
            >
              <Text
                style={[typography.titleSmall, { color: colors.onSurface }]}
                numberOfLines={2}
              >
                {extractDocumentTitle(item.content)}
              </Text>
              <View style={styles.dates}>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  Angelegt {formatDate(item.createdAt)}
                </Text>
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>
                  Geändert {formatDate(item.updatedAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <NoteEditorModal
        visible={editNote != null}
        note={editNote}
        onClose={() => setEditNote(null)}
        onDeleted={() => setEditNote(null)}
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  searchWrap: {
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    gap: spacing.s,
  },
  searchInput: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  list: { padding: spacing.m, gap: spacing.m },
  card: {
    borderRadius: 12,
    padding: spacing.m,
    gap: spacing.xs,
  },
  dates: {
    flexDirection: 'row',
    gap: spacing.m,
    flexWrap: 'wrap',
  },
});
