import { View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from 'react-native';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[typography.headlineMedium, { color: colors.onBackground }]}>
        ragapp
      </Text>
      <Text style={[typography.bodyLarge, { color: colors.onSurfaceVariant, marginTop: spacing.m }]}>
        Anmeldung kommt in Phase 3
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
  },
});
