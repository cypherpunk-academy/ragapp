import React, { useMemo, useState } from 'react';
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
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/data/services/authService';
import { useAuth } from '@/shared/hooks/useAuth';
import { darkColors, lightColors, spacing, textStyles, typography } from '@/shared/theme';

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return 'Ein Fehler ist aufgetreten.';
}

export default function RegisterScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { email: emailParam } = useLocalSearchParams<{ email?: string | string[] }>();
  const initialEmail = useMemo(() => {
    if (typeof emailParam === 'string') return emailParam;
    if (Array.isArray(emailParam) && emailParam[0]) return emailParam[0];
    return '';
  }, [emailParam]);
  const [email, setEmail] = useState(initialEmail);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const { isConfigured } = useAuth();

  const trimmedEmail = email.trim();
  const trimmedName = name.trim();

  const handleCreate = async () => {
    setError(null);
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    if (!trimmedName) {
      setError('Bitte einen Namen eingeben.');
      return;
    }
    if (!authService.isAvailable()) {
      setError('Anmeldung ist hier noch nicht eingerichtet (Supabase fehlt).');
      return;
    }
    setBusy(true);
    try {
      await authService.signUpWithMagicLink(trimmedEmail, trimmedName);
      setSent(true);
    } catch (e) {
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
          Konto anlegen
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

        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
          Für diese E-Mail-Adresse existiert noch kein Konto. Legen Sie ein Konto an; wir senden Ihnen einen Link zur
          Bestätigung.
        </Text>

        {sent ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
              Wir haben einen Bestätigungslink an{' '}
              <Text style={{ fontFamily: textStyles.noteBody.fontFamily }}>{trimmedEmail}</Text>
              {' '}gesendet. Öffnen Sie die E-Mail auf diesem Gerät, um die Registrierung abzuschließen.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.replace('/(tabs)')}
            >
              <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Zur App</Text>
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
              placeholderTextColor={colors.onSurfaceVariant}
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
            <Text
              style={[
                textStyles.contributionsBreadcrumb,
                { color: colors.onSurfaceVariant, marginBottom: spacing.s, marginTop: spacing.m },
              ]}
            >
              Name
            </Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Ihr Anzeigename"
              placeholderTextColor={colors.onSurfaceVariant}
              autoCapitalize="words"
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
              onPress={() => void handleCreate()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Link senden</Text>
              )}
            </TouchableOpacity>
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
});
