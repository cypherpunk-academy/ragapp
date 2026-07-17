import React from 'react';
import { Text, Pressable, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, textStyles, fonts } from '@/shared/theme';
import { splitTextWithCitations } from '@/shared/lib/citationMarkers';

type Props = {
  text: string;
  onCitationPress?: (citationIndex: number) => void;
};

/**
 * Assistenten-Antwort mit tappbaren `[N]`-Markern (Figma §16.6).
 */
export default function AssistantMessageText({ text, onCitationPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const segments = splitTextWithCitations(text);

  if (segments.length === 0) {
    return (
      <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={[textStyles.noteBody, { color: colors.onSurface }]}>
      {segments.map((seg, i) => {
        if (seg.kind === 'text') {
          return <Text key={i}>{seg.value}</Text>;
        }
        return (
          <Text
            key={i}
            onPress={onCitationPress ? () => onCitationPress(seg.index) : undefined}
            suppressHighlighting
            style={[styles.citation, { color: colors.primary }]}
          >
            {seg.value}
          </Text>
        );
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  citation: {
    fontFamily: fonts.derived,
    fontSize: 10,
    lineHeight: 18,
  },
});
