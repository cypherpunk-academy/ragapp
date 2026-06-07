import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authErrorSuggestsNewAccount, authService } from '@/data/services/authService';
import { useAuth } from '@/shared/hooks/useAuth';
import { darkColors, lightColors, spacing, textStyles, typography } from '@/shared/theme';

const appleSignInAvailable = authService.isAppleSignInAvailable();

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Ein Fehler ist aufgetreten.';
}

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const trimmed = email.trim();

  const handleApple = async () => {
    setError(null);
    setBusy(true);
    try {
      await authService.signInWithApple();
      router.replace('/(tabs)');
    } catch (e: unknown) {
      // User cancelled — Apple throws ERR_REQUEST_CANCELED
      const code = e && typeof e === 'object' && 'code' in e ? (e as { code: string }).code : '';
      if (code !== 'ERR_REQUEST_CANCELED') {
        setError(errorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async () => {
    setError(null);
    if (!trimmed || !trimmed.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    if (!authService.isAvailable()) {
      setError('Anmeldung ist hier noch nicht eingerichtet (Supabase fehlt).');
      return;
    }
    setBusy(true);
    try {
      await authService.signInWithMagicLinkExistingUser(trimmed);
      setSent(true);
    } catch (e) {
      if (authErrorSuggestsNewAccount(e)) {
        router.push({ pathname: '/auth/register', params: { email: trimmed } });
        return;
      }
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.appBar, { borderBottomColor: colors.outlineVariant }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.onBackground} />
        </TouchableOpacity>
        <Text style={[textStyles.contributionsTitle, { color: colors.onBackground, flex: 1 }]} numberOfLines={1}>
          Anmelden
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {!isConfigured ? (
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.m }]}>
            Supabase ist nicht konfiguriert. Tragen Sie EXPO_PUBLIC_SUPABASE_URL und EXPO_PUBLIC_SUPABASE_ANON_KEY in der
            Umgebung ein und starten Sie die App neu.
          </Text>
        ) : null}

        {sent ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
              Wir haben einen Anmeldelink an{' '}
              <Text style={{ fontFamily: textStyles.noteBody.fontFamily }}>{trimmed}</Text>
              {' '}gesendet. Öffnen Sie die E-Mail auf diesem Gerät, um die Anmeldung abzuschließen.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.back()}
            >
              <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Zurück</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}>
              E-Mail
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="name@beispiel.de"
              placeholderTextColor={colors.onSurfaceVariant + '80'}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              style={[
                styles.input,
                textStyles.noteBody,
                { color: colors.onSurface, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
              ]}
            />
            {error ? (
              <Text style={[typography.bodySmall, { color: colors.error, marginTop: spacing.s }]}>{error}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
              onPress={() => void handleSend()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Link senden</Text>
              )}
            </TouchableOpacity>

            {appleSignInAvailable && (
              <>
                <View style={[styles.dividerRow, { marginTop: spacing.m }]}>
                  <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
                  <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginHorizontal: spacing.s }]}>
                    oder
                  </Text>
                  <View style={[styles.dividerLine, { backgroundColor: colors.outlineVariant }]} />
                </View>
                <TouchableOpacity
                  style={[styles.appleBtn, { backgroundColor: colors.onBackground }]}
                  onPress={() => void handleApple()}
                  disabled={busy}
                  activeOpacity={0.85}
                >
                  <Ionicons name="logo-apple" size={20} color={colors.background} />
                  <Text style={[textStyles.continueCta, { color: colors.background }]}>Mit Apple anmelden</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
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
  body: { padding: spacing.m, gap: spacing.m },
  card: { borderRadius: 12, padding: spacing.l, gap: spacing.m },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 8,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
  },
  primaryBtn: {
    marginTop: spacing.m,
    borderRadius: 999,
    paddingVertical: spacing.s,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dividerLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
    borderRadius: 999,
    paddingVertical: spacing.s,
    minHeight: 44,
    marginTop: spacing.m,
  },
});
