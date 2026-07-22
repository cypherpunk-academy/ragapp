import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, useColorScheme, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { navigateToChatWithPendingLink } from '@/shared/lib/chatNavigation';
import { Ionicons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';
import { NoteRepository } from '@/data/repositories/NoteRepository';
import DocumentPreviewOverlay from '@/shared/components/DocumentPreviewOverlay';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import type Note from '@/data/db/models/Note';

function hasDocumentBody(content: string): boolean {
  // Strip the # title line and check if any non-empty content remains
  const body = content.replace(/^#[^\n]*\n?/, '').trim();
  return body.length > 0;
}

function formatRelativeDate(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);

  if (diffSec < 60) return 'vor wenigen Sekunden';
  if (diffMin < 60) return `vor ${diffMin} ${diffMin === 1 ? 'Minute' : 'Minuten'}`;
  if (diffHours < 24) return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
  const dayBefore = new Date(today); dayBefore.setDate(today.getDate() - 2);
  const dateDay = new Date(date); dateDay.setHours(0, 0, 0, 0);

  if (dateDay.getTime() === yesterday.getTime()) return 'gestern';
  if (dateDay.getTime() === dayBefore.getTime()) return 'vorgestern';
  return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

/** Bibliothek allgemeiner Arbeitstexte (ohne Buch-/Kapitel-/Absatz-Verknüpfung). */
export default function ArbeitstexteScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewNote, setPreviewNote] = useState<Note | null>(null);

  useEffect(() => {
    const sub = NoteRepository.observeGeneral().subscribe((ns) => {
      setNotes(ns);
      setLoading(false);
    });
    return () => sub.unsubscribe();
  }, []);

  const filtered = useMemo(() => {
    const withBody = notes.filter((n) => hasDocumentBody(n.content));
    const q = searchQuery.toLowerCase().trim();
    if (!q) return withBody;
    return withBody.filter((n) =>
      extractDocumentTitle(n.content).toLowerCase().includes(q),
    );
  }, [notes, searchQuery]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* AppBar */}
      <View style={[styles.header, { borderBottomColor: colors.outlineVariant, paddingTop: insets.top + spacing.s }]}>
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
              style={styles.card}
              onPress={() => setPreviewNote(item)}
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
                  Geändert {formatRelativeDate(item.updatedAt)}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <DocumentPreviewOverlay
        note={previewNote}
        onClose={() => setPreviewNote(null)}
        onDeleted={() => setPreviewNote(null)}
        onEditInChat={previewNote ? () => {
          navigateToChatWithPendingLink(previewNote.id);
          router.back();
        } : undefined}
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
    backgroundColor: '#f0faf0',
    borderWidth: 1,
    borderColor: '#c2dfc2',
  },
  dates: {
    flexDirection: 'row',
    gap: spacing.m,
    flexWrap: 'wrap',
  },
});
