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
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService, authErrorSuggestsNewAccount } from '@/data/services/authService';
import { useAuth } from '@/shared/hooks/useAuth';
import i18n from '@/shared/i18n';
import { darkColors, lightColors, spacing, textStyles, typography } from '@/shared/theme';

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message;
  }
  return i18n.t('auth.genericError');
}

export default function LoginScreen() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const insets = useSafeAreaInsets();
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const trimmed = email.trim();

  const handleSend = async () => {
    setError(null);
    if (!trimmed || !trimmed.includes('@')) {
      setError(t('auth.invalidEmail'));
      return;
    }
    if (!authService.isAvailable()) {
      setError(t('auth.supabaseNotConfiguredShort'));
      return;
    }
    setBusy(true);
    try {
      // Existing user → OTP code; new user → falls through to signUp
      await authService.signInWithMagicLinkExistingUser(trimmed);
      setSent(true);
      setOtp('');
    } catch (e) {
      if (authErrorSuggestsNewAccount(e)) {
        try {
          await authService.signUpWithMagicLink(trimmed, '');
          setSent(true);
          setOtp('');
        } catch (e2) {
          setError(errorMessage(e2));
        }
      } else {
        setError(errorMessage(e));
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const code = otp.trim();
    if (code.length < 6) {
      setError(t('auth.enterEmailCode'));
      return;
    }
    setBusy(true);
    try {
      await authService.verifyEmailOtp(trimmed, code);
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
          {t('auth.loginTitle')}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {!isConfigured ? (
          <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.m }]}>
            {t('auth.supabaseNotConfiguredLong')}
          </Text>
        ) : null}

        {sent ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
              {t('auth.codeSent', { email: trimmed })}
            </Text>
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
              {t('auth.otpLabel')}
            </Text>
            <TextInput
              value={otp}
              onChangeText={setOtp}
              placeholder={t('auth.otpPlaceholder')}
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
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>{t('auth.loginTitle')}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.surfaceContainerHighest }]}
              onPress={() => { setSent(false); setError(null); setOtp(''); }}
              disabled={busy}
            >
              <Text style={[textStyles.continueCta, { color: colors.onSurface }]}>{t('auth.otherEmail')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}>
              {t('auth.emailLabel')}
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder={t('auth.emailPlaceholder')}
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
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>{t('auth.sendCode')}</Text>
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
