import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, ActivityIndicator,
  StyleSheet, useColorScheme, Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { lightColors, darkColors, spacing, typography, ICONS, ICON_SIZES } from '@/shared/theme';
import { useAuth } from '@/shared/hooks/useAuth';
import { useConnectorStatus } from '@/shared/hooks/useConnectorStatus';
import { NoteRepository, type NoteRow } from '@/data/repositories/NoteRepository';
import { extractDocumentTitle } from '@/data/lib/documentTree';
import { config } from '@/data/lib/config';
import { assistant } from '@/shared/lib/assistant';

const RECENT_LIMIT = 5;

export default function WerkstattScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { isAuthenticated, isConfigured, loading: authLoading } = useAuth();
  const { status, refresh: refreshStatus } = useConnectorStatus();

  const [recentNotes, setRecentNotes] = useState<NoteRow[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);

  const loadRecentNotes = useCallback(async () => {
    if (!isAuthenticated) return;
    setNotesLoading(true);
    try {
      const all = await NoteRepository.list();
      setRecentNotes(all.slice(0, RECENT_LIMIT));
    } catch {
      // silent
    } finally {
      setNotesLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (status === 'connected') void loadRecentNotes();
  }, [status, loadRecentNotes]);

  const openConnectorSetup = useCallback(async () => {
    const mcpUrl = config.ragrun.baseUrl
      ? `${config.ragrun.baseUrl}/mcp/`
      : null;
    if (!mcpUrl) return;
    const url = `https://claude.ai/settings/integrations?add=${encodeURIComponent(mcpUrl)}`;
    await Linking.openURL(url);
  }, []);

  const openNewChat = useCallback(async () => {
    const url = 'https://claude.ai/new';
    await Linking.openURL(url);
  }, []);

  if (authLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Not logged in
  if (isConfigured && !isAuthenticated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialIcons name="lock-outline" size={48} color={colors.onSurfaceVariant} />
        <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.m }]}>
          {t('werkstatt.loginPrompt')}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/auth')}
        >
          <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>
            {t('common.signIn')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Not connected / Revoked
  if (status === 'not_connected' || status === 'revoked') {
    const isRevoked = status === 'revoked';
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialIcons
          name={isRevoked ? 'link-off' : 'add-link'}
          size={48}
          color={colors.onSurfaceVariant}
        />
        <Text style={[typography.titleMedium, { color: colors.onSurface, textAlign: 'center', marginTop: spacing.m }]}>
          {t(isRevoked ? 'werkstatt.revokedTitle' : 'werkstatt.notConnectedTitle')}
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.s, paddingHorizontal: spacing.xl }]}>
          {t(isRevoked ? 'werkstatt.revokedBody' : 'werkstatt.notConnectedBody')}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={openConnectorSetup}
        >
          <Text style={[typography.labelLarge, { color: colors.onPrimary }]}>
            {t(isRevoked ? 'werkstatt.revokedButton' : 'werkstatt.notConnectedButton')}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Connected but unused
  if (status === 'connected_unused') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialIcons name="check-circle-outline" size={48} color={colors.primary} />
        <Text style={[typography.titleMedium, { color: colors.onSurface, textAlign: 'center', marginTop: spacing.m }]}>
          {t('werkstatt.connectedUnusedTitle')}
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center', marginTop: spacing.s, paddingHorizontal: spacing.xl }]}>
          {t('werkstatt.connectedUnusedBody')}
        </Text>
      </View>
    );
  }

  // Loading connector status
  if (status === 'loading') {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Connected — main view
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.s, borderBottomColor: colors.outlineVariant }]}>
        <Text style={[typography.titleMedium, { color: colors.onSurface }]}>
          {t('werkstatt.connectedTitle')}
        </Text>
      </View>

      {/* New conversation button */}
      <TouchableOpacity
        style={[styles.newChatButton, { backgroundColor: colors.primaryContainer }]}
        onPress={openNewChat}
        activeOpacity={0.7}
      >
        <MaterialIcons name="chat-bubble-outline" size={20} color={colors.onPrimaryContainer} />
        <Text style={[typography.labelLarge, { color: colors.onPrimaryContainer }]}>
          {t('werkstatt.connectedNewChat')}
        </Text>
      </TouchableOpacity>

      {/* Recent work texts */}
      <View style={styles.sectionHeader}>
        <Text style={[typography.titleSmall, { color: colors.onSurfaceVariant }]}>
          {t('werkstatt.recentTexts')}
        </Text>
        <TouchableOpacity onPress={() => router.push('/arbeitstexte')}>
          <Text style={[typography.labelMedium, { color: colors.primary }]}>
            {t('werkstatt.allTexts')}
          </Text>
        </TouchableOpacity>
      </View>

      {notesLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.l }} />
      ) : recentNotes.length === 0 ? (
        <View style={styles.emptyNotes}>
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
            {t('werkstatt.emptyTexts')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={recentNotes}
          keyExtractor={(n) => n.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.noteCard, { backgroundColor: colors.surfaceContainerLow }]}
              onPress={() => router.push({ pathname: '/arbeitstexte', params: { noteId: item.id } })}
              activeOpacity={0.7}
            >
              <Text style={[typography.bodyMedium, { color: colors.onSurface }]} numberOfLines={2}>
                {extractDocumentTitle(item.content)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  header: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.s,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  primaryButton: {
    marginTop: spacing.l,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.m,
    borderRadius: 24,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.s,
    margin: spacing.m,
    padding: spacing.m,
    borderRadius: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  emptyNotes: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  list: {
    paddingHorizontal: spacing.m,
    gap: spacing.s,
  },
  noteCard: {
    padding: spacing.m,
    borderRadius: 12,
  },
});
