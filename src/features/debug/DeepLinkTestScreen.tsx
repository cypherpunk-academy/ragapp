import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  useColorScheme,
  Platform,
  Alert,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { router } from 'expo-router';
import AppBar from '@/shared/components/AppBar';
import { lightColors, darkColors, spacing, typography } from '@/shared/theme';

const DEFAULT_PROMPT =
  'Filo, Band 4 \u201eDie Philosophie der Freiheit\u201c, Kapitel 3: Wie h\u00e4ngt Steiners Begriff der \u201esittlichen Phantasie\u201c mit der \u00dcberwindung des Dualismus zusammen? Lade Filo-Kontext k7f3d';

type Variant = {
  id: number;
  label: string;
  description: string;
  run: (prompt: string) => Promise<void>;
};

function buildVariants(): Variant[] {
  return [
    {
      id: 1,
      label: 'HTTPS Universal Link',
      description: 'Linking.openURL(https://claude.ai/new?q=...)',
      run: async (prompt) => {
        const url = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
        await Linking.openURL(url);
      },
    },
    {
      id: 2,
      label: 'Custom Scheme',
      description: 'claude://claude.ai/new?q=...',
      run: async (prompt) => {
        const url = `claude://claude.ai/new?q=${encodeURIComponent(prompt)}`;
        const supported = await Linking.canOpenURL(url);
        if (!supported) {
          Alert.alert('Nicht unterstützt', `canOpenURL returned false für: ${url}`);
          return;
        }
        await Linking.openURL(url);
      },
    },
    {
      id: 3,
      label: 'Android Intent',
      description: 'intent://...#Intent;scheme=https;package=com.anthropic.claude;end',
      run: async (prompt) => {
        if (Platform.OS !== 'android') {
          Alert.alert('Nur Android', 'Intents funktionieren nur auf Android.');
          return;
        }
        const url = `intent://claude.ai/new?q=${encodeURIComponent(prompt)}#Intent;scheme=https;package=com.anthropic.claude;end`;
        await Linking.openURL(url);
      },
    },
    {
      id: 4,
      label: 'In-App-Browser',
      description: 'WebBrowser.openBrowserAsync(https://claude.ai/new?q=...)',
      run: async (prompt) => {
        const url = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
        await WebBrowser.openBrowserAsync(url);
      },
    },
  ];
}

export default function DeepLinkTestScreen() {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const variants = buildVariants();

  const handlePress = async (variant: Variant) => {
    setLastResult(`Variante ${variant.id}: ${variant.label}...`);
    try {
      await variant.run(prompt);
      setLastResult(`Variante ${variant.id}: geöffnet`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setLastResult(`Variante ${variant.id} Fehler: ${msg}`);
      Alert.alert('Fehler', msg);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppBar title="Deep-Link-Test" onBackPress={() => router.back()} showUserMenu={false} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginBottom: spacing.xs }]}>
          Prompt ({prompt.length} Zeichen)
        </Text>
        <TextInput
          style={[styles.input, {
            color: colors.onSurface,
            backgroundColor: colors.surfaceContainer,
            borderColor: colors.outline,
          }]}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <Text style={[typography.labelMedium, { color: colors.onSurfaceVariant, marginTop: spacing.m, marginBottom: spacing.s }]}>
          Link-Varianten
        </Text>

        {variants.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={[styles.button, { backgroundColor: colors.primaryContainer }]}
            onPress={() => handlePress(v)}
            activeOpacity={0.7}
          >
            <Text style={[typography.labelLarge, { color: colors.onPrimaryContainer }]}>
              {v.id}. {v.label}
            </Text>
            <Text style={[typography.bodySmall, { color: colors.onPrimaryContainer, opacity: 0.7, marginTop: 2 }]}>
              {v.description}
            </Text>
          </TouchableOpacity>
        ))}

        {lastResult && (
          <View style={[styles.resultBox, { backgroundColor: colors.surfaceContainerHigh }]}>
            <Text style={[typography.bodySmall, { color: colors.onSurface }]}>{lastResult}</Text>
          </View>
        )}

        <Text style={[typography.bodySmall, { color: colors.onSurfaceVariant, marginTop: spacing.l }]}>
          Kodierungsprüfung: Umlaute (äöüÄÖÜ), ß, Anführungszeichen (\u201e\u201c), Länge ~300 Zeichen.
          {'\n\n'}
          Prüfen nach jedem Test:{'\n'}
          - Wohin führt der Link?{'\n'}
          - ?q= durchgereicht?{'\n'}
          - Prompt absendbar?{'\n'}
          - Connector aktiv im neuen Chat?{'\n'}
          - Kodierung OK?
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.m, paddingBottom: spacing.xl },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.s,
    fontSize: 14,
    minHeight: 100,
  },
  button: {
    padding: spacing.m,
    borderRadius: 10,
    marginBottom: spacing.s,
  },
  resultBox: {
    padding: spacing.s,
    borderRadius: 8,
    marginTop: spacing.s,
  },
});
