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
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/data/services/authService';
import { redeemInvitation } from '@/data/services/invitationService';
import i18n from '@/shared/i18n';
import { darkColors, lightColors, spacing, textStyles, typography } from '@/shared/theme';

/** Map common Supabase/backend messages to localized copy. */
function translateError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('security purposes') && lower.includes('request this after')) {
    const secs = msg.match(/after\s+(\d+)\s+seconds/i);
    return secs
      ? i18n.t('auth.rateLimitSeconds', { seconds: secs[1] })
      : i18n.t('auth.rateLimitGeneric');
  }
  if (lower.includes('abgelaufen') || lower.includes('expired')) {
    return i18n.t('auth.inviteCodeExpired');
  }
  return msg;
}

function errorMessage(err: unknown): string {
  if (err && typeof err === 'object') {
    // RagrunApiError has body.detail
    const body = (err as { body?: { detail?: string } }).body;
    if (body?.detail) return translateError(body.detail);
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return translateError((err as { message: string }).message);
    }
  }
  return i18n.t('auth.genericError');
}

export default function RedeemInvitationScreen() {
  const { t } = useTranslation();
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
      setError(t('auth.invalidEmail'));
      return;
    }
    if (code.trim().length !== 4) {
      setError(t('auth.inviteCodeRequired'));
      return;
    }
    setBusy(true);
    try {
      const { email_otp } = await redeemInvitation(trimmedEmail, code.trim());
      setRedeemed(true);

      if (email_otp) {
        // Auto-login: verify the OTP returned by the server directly
        await authService.verifyEmailOtp(trimmedEmail, email_otp);
        router.replace('/(tabs)');
        return;
      }

      // Fallback: server couldn't generate OTP — send a login code via email
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
      setError(t('auth.enterEmailCode'));
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
          {t('auth.redeemTitle')}
        </Text>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + spacing.xl }]}
      >
        {otpSent ? (
          <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
            <Text style={[textStyles.contributionsTab, { color: colors.onSurface }]}>
              {t('auth.welcomeOtpSent', { email: trimmedEmail })}
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
              editable={!busy && !redeemed}
              style={[
                styles.input,
                textStyles.noteBody,
                { color: colors.onSurface, borderColor: colors.outlineVariant, backgroundColor: colors.surfaceContainerLowest },
              ]}
            />
            <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant, marginBottom: spacing.s }]}>
              {t('auth.inviteCodeLabel')}
            </Text>
            <TextInput
              value={code}
              onChangeText={setCode}
              placeholder={t('auth.inviteCodePlaceholder')}
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
                <Text style={[textStyles.continueCta, { color: colors.onPrimary }]}>{t('auth.redeem')}</Text>
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
