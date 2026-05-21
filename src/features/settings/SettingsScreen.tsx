import React from 'react';
import { View, Text, ScrollView, StyleSheet, useColorScheme } from 'react-native';
import AppBar from '@/shared/components/AppBar';
import { router } from 'expo-router';
import { lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title="Einstellungen" onBackPress={() => router.back()} showUserMenu={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            DARSTELLUNG
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>
            Dunkelmodus und Schriftgröße folgen in einer späteren Version.
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer }]}>
          <Text style={[textStyles.contributionsBreadcrumb, { color: colors.onSurfaceVariant }]}>
            ÜBER
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.onSurface }]}>ragapp · Version 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.m, gap: spacing.m },
  card: { borderRadius: 12, padding: spacing.l, gap: spacing.s },
});
