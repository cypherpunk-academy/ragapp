import React from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, textStyles, fonts } from '@/shared/theme';
import { splitTextWithCitations } from '@/shared/lib/citationMarkers';
import { parseMdInline } from '@/shared/lib/parseMdInline';
import { useContentScale, scaleContentStyle } from '@/shared/hooks/useContentScale';

type Props = {
  text: string;
  onCitationPress?: (citationIndex: number) => void;
};

/**
 * Assistenten-Antwort mit tappbaren `[N]`-Markern (Figma §16.6)
 * und Inline-Markdown (`**bold**`, `*italic*`, `_underline_`).
 */
export default function AssistantMessageText({ text, onCitationPress }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const scaledNoteBody = scaleContentStyle(textStyles.noteBody, useContentScale());
  const segments = splitTextWithCitations(text);

  if (segments.length === 0) {
    return (
      <Text style={[scaledNoteBody, { color: colors.onSurface }]}>
        {text}
      </Text>
    );
  }

  return (
    <Text style={[scaledNoteBody, { color: colors.onSurface }]}>
      {segments.flatMap((seg, i) => {
        if (seg.kind === 'text') {
          return parseMdInline(seg.value).map((md, j) => (
            <Text
              key={`${i}-${j}`}
              style={[
                md.bold && styles.bold,
                md.italic && styles.italic,
                md.underline && styles.underline,
              ]}
            >
              {md.text}
            </Text>
          ));
        }
        return [
          <Text
            key={i}
            onPress={onCitationPress ? () => onCitationPress(seg.index) : undefined}
            suppressHighlighting
            style={[styles.citation, { color: colors.primary }]}
          >
            {seg.value}
          </Text>,
        ];
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: { fontFamily: fonts.derivedBold, fontWeight: '700' },
  italic: { fontFamily: fonts.derivedItalic, fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
  citation: {
    fontFamily: fonts.derived,
    fontSize: 10,
    lineHeight: 18,
  },
});
