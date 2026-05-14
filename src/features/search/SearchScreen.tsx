import React from 'react';
import { View, Text, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, typography, borderRadius } from '../../theme';

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBar, { backgroundColor: colors.surfaceContainerHigh }]}>
        <TextInput
          placeholder="Suche im Textkorpus…"
          placeholderTextColor={colors.onSurfaceVariant}
          style={[typography.bodyLarge, { color: colors.onSurface, flex: 1 }]}
          editable={false}
        />
      </View>
      <View style={[styles.offlineBanner, { backgroundColor: colors.surfaceContainerLow }]}>
        <Text style={[typography.bodyMedium, { color: colors.onSurfaceVariant }]}>
          Suche erfordert Internet-Verbindung (Phase 1+)
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.m,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    marginBottom: spacing.m,
  },
  offlineBanner: {
    borderRadius: borderRadius.m,
    padding: spacing.m,
    alignItems: 'center',
  },
});
