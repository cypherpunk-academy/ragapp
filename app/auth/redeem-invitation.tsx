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
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/data/services/authService';
import { redeemInvitation } from '@/data/services/invitationService';
import { darkColors, lightColors, spacing, textStyles, typography } from '@/shared/theme';

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // RagrunApiError has body.detail
    const body = (err as { body?: { detail?: string } }).body;
    if (body?.detail) return body.detail;
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
  }
  return 'Ein Fehler ist aufgetreten.';
}

export default function RedeemInvitationScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ email?: string }>();

  const [email, setEmail] = useState(params.email ?? '');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  const trimmedEmail = email.trim();

  const handleRedeem = async () => {
    setError(null);
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Bitte eine gültige E-Mail-Adresse eingeben.');
      return;
    }
    if (code.trim().length !== 4) {
      setError('Bitte den 4-stelligen Einladungscode eingeben.');
      return;
    }
    setBusy(true);
    try {
      await redeemInvitation(trimmedEmail, code.trim());
      setRedeemed(true);
      // Now send magic link to the newly created user
      await authService.signInWithMagicLinkExistingUser(trimmedEmail);
      setOtpSent(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const otpCode = otp.trim();
    if (otpCode.length < 6) {
      setError('Bitte den Code aus der E-Mail eingeben.');
      return;
    }
    setBusy(true);
    try {
      await authService.verifyEmailOtp(trimmedEmail, otpCode);
      router.replace('/(tabs)');
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
          Einladung einlösen
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {otpSent ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
              Willkommen! Wir haben eine E-Mail an{' '}
              <Text style={{ fontFamily: textStyles.noteBody.fontFamily }}>{trimmedEmail}</Text>
              {' '}gesendet. Bitte den Code aus der Mail hier eingeben.
            </Text>
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
              Code aus der E-Mail
            </Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder="123456"
              placeholderTextColor={colors.onSurfaceVariant + '80'}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              editable={!busy}
              style={[
                styles.input,
                textStyles.noteBody,
                { color: colors.onSurface, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
              ]}
            />
            {error ? (
              <Text style={[typography.bodySmall, { color: colors.error }]}>{error}</Text>
            ) : null}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary, opacity: busy ? 0.7 : 1 }]}
              onPress={() => void handleVerifyOtp()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Anmelden</Text>
              )}
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
              editable={!busy && !redeemed}
              style={[
                styles.input,
                textStyles.noteBody,
                { color: colors.onSurface, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
              ]}
            />
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}>
              Einladungscode (4 Ziffern)
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder="1234"
              placeholderTextColor={colors.onSurfaceVariant + '80'}
              keyboardType="number-pad"
              maxLength={4}
              editable={!busy && !redeemed}
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
              onPress={() => void handleRedeem()}
              disabled={busy}
            >
              {busy ? (
                <ActivityIndicator color={colors.onPrimary} />
              ) : (
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>Einlösen</Text>
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
