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
import { sendInvitation } from '@/data/services/invitationService';
import { darkColors, lightColors, spacing, textStyles, typography } from '@/shared/theme';

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    const body = (err as { body?: { detail?: string } }).body;
    if (body?.detail) return body.detail;
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  return 'Ein Fehler ist aufgetreten.';
}

export default function InviteScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSend = async () => {
    setError(null);
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    setBusy(true);
    try {
      await sendInvitation(trimmed);
      setSentEmail(trimmed);
      setSuccess(true);
      setEmail('');
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
          Teilnehmer einladen
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {success ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Ionicons name="checkmark-circle" size={48} color={colors.primary} style={{ alignSelf: 'center' }} />
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface, textAlign: 'center' }]}>
              Einladung an{' '}
              <Text style={{ fontFamily: textStyles.noteBody.fontFamily }}>{sentEmail}</Text>
              {' '}gesendet.
            </Text>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => { setSuccess(false); setError(null); }}
            >
              <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Weitere Einladung</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.surfaceContainerHighest }]}
              onPress={() => router.back()}
            >
              <Text style={[textStyles.continueCta, { color: colors.onSurface }]}>Zurück</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
              Laden Sie einen neuen Teilnehmer ein. Die Person erhält eine E-Mail mit einem Einladungscode.
            </Text>
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}>
              E-Mail des Eingeladenen
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
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Einladung senden</Text>
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
