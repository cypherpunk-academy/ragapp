import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  useColorScheme, ActivityIndicator, Alert,
} from 'react-native';
import { router } from 'expo-router';
import AppBar from '@/shared/components/AppBar';
import AppIcon from '@/shared/components/AppIcon';
import { lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { ICONS, ICON_SIZES } from '@/shared/theme';
import { useAuth } from '@/shared/hooks/useAuth';
import { useSync } from '@/shared/hooks/useSync';
import { authService } from '@/data/services/authService';

function formatSyncTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

type Props = {
  variant?: 'stack';
};

export default function KontoScreen({ variant }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const { user, loading, isAuthenticated, isConfigured } = useAuth();
  const { syncing, lastSyncedAt, lastError, sync } = useSync();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Abmelden', 'Möchten Sie sich wirklich abmelden?', [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Abmelden',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await authService.signOut();
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Konto löschen',
      'Alle Notizen und Lesezeichen werden unwiderruflich gelöscht. Fortfahren?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Konto löschen',
          style: 'destructive',
          onPress: () => {
            // TODO: call delete-account Edge Function when implemented
            Alert.alert('Nicht verfügbar', 'Bitte kontaktieren Sie den Support zum Löschen Ihres Kontos.');
          },
        },
      ],
    );
  };

  const isStack = variant === 'stack';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar
        title="Konto"
        showUserMenu={false}
        onBackPress={isStack ? () => router.back() : undefined}
      />
      <ScrollView contentContainerStyle={styles.content}>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {!loading && !isAuthenticated && (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <AppIcon name={ICONS.account.avatar} size={ICON_SIZES.hero} color={colors.onSurfaceVariant} style={styles.avatarIcon} />
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface, textAlign: 'center' }]}>
              Melden Sie sich an, um Notizen und Gespräche geräteübergreifend zu synchronisieren.
            </Text>
            {!isConfigured && (
              <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, textAlign: 'center' }]}>
                Supabase ist nicht konfiguriert (EXPO_PUBLIC_SUPABASE_URL fehlt).
              </Text>
            )}
            {isConfigured && (
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/auth/login')}
                activeOpacity={0.85}
              >
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Anmelden</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {!loading && isAuthenticated && user && (
          <>
            {/* Profil */}
            <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
              <View style={styles.profileRow}>
                <View style={[styles.avatarCircle, { backgroundColor: colors.secondaryContainer }]}>
                  <AppIcon name={ICONS.account.avatar} size={32} color={colors.onSecondaryContainer} />
                </View>
                <View style={styles.profileText}>
                  <Text style={[textStyles.contributionsTitle, { color: colors.onSurface }]} numberOfLines={1}>
                    {user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? 'Angemeldet'}
                  </Text>
                  <Text style={[textStyles.noteMeta, { color: colors.onSurfaceVariant }]} numberOfLines={1}>
                    {user.email ?? ''}
                  </Text>
                </View>
              </View>
            </View>

            {/* Sync */}
            <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
              <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
                SYNCHRONISATION
              </Text>
              <View style={styles.syncRow}>
                <Text style={[typography.bodyMedium, { color: colors.onSurface, flex: 1 }]}>
                  {syncing
                    ? 'Synchronisiere…'
                    : lastError
                      ? `Fehler: ${lastError}`
                      : lastSyncedAt
                        ? `Zuletzt: ${formatSyncTime(lastSyncedAt)}`
                        : 'Noch nicht synchronisiert'}
                </Text>
                <TouchableOpacity
                  style={[styles.syncBtn, { backgroundColor: colors.primary, opacity: syncing ? 0.6 : 1 }]}
                  onPress={() => void sync()}
                  disabled={syncing}
                  activeOpacity={0.8}
                >
                  {syncing
                    ? <ActivityIndicator size="small" color={colors.onPrimary} />
                    : <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Jetzt</Text>}
                </TouchableOpacity>
              </View>
            </View>

            {/* Aktionen */}
            <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleSignOut}
                disabled={signingOut}
                activeOpacity={0.7}
              >
                {signingOut
                  ? <ActivityIndicator size="small" color={colors.error} />
                  : <Text style={[typography.bodyMedium, { color: colors.error }]}>Abmelden</Text>}
              </TouchableOpacity>
              <View style={[styles.separator, { backgroundColor: colors.outlineVariant }]} />
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleDeleteAccount}
                activeOpacity={0.7}
              >
                <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant }]}>Konto löschen…</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.m, gap: spacing.m },
  center: { alignItems: 'center', paddingVertical: spacing.xxl },
  card: { borderRadius: 12, padding: spacing.l, gap: spacing.m },
  avatarIcon: { alignSelf: 'center' },
  primaryBtn: {
    borderRadius: 999,
    paddingVertical: spacing.s,
    alignItems: 'center',
    minHeight: 44,
    justifyContent: 'center',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileText: { flex: 1, gap: 2 },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.m },
  syncBtn: {
    borderRadius: 999,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.m,
    minWidth: 64,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  actionRow: { paddingVertical: spacing.xs, minHeight: 40, justifyContent: 'center' },
  separator: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xs },
});
