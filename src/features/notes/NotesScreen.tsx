import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, typography } from '../../theme';

export default function NotesScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.titleLarge, { color: colors.onBackground, marginBottom: spacing.s }]}>
        Notizen
      </Text>
      <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
        Anmeldung erforderlich (Phase 2+)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.m,
  },
});
