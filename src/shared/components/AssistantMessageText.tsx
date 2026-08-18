import React, { useEffect, useState } from 'react';
import { Platform, Text, TextInput, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, textStyles } from '@/shared/theme';
import { splitTextWithCitations } from '@/shared/lib/citationMarkers';
import { parseMdInline } from '@/shared/lib/parseMdInline';
import { useContentScale, scaleContentStyle } from '@/shared/hooks/useContentScale';

type Props = {
  text: string;
};

/**
 * Assistenten-Antwort mit nativer Textauswahl
 * und Inline-Markdown (`**bold**`, `*italic*`, `_underline_`).
 */
export default function AssistantMessageText({ text }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const scaledNoteBody = scaleContentStyle(textStyles.noteBody, useContentScale());
  const segments = splitTextWithCitations(text);
  const [androidSelectable, setAndroidSelectable] = useState(Platform.OS !== 'android');
  const plainText = segments.map((seg) => {
    if (seg.kind === 'text') {
      return parseMdInline(seg.value).map((md) => md.text).join('');
    }
    return seg.value;
  }).join('');

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    setAndroidSelectable(false);
    const frame = requestAnimationFrame(() => setAndroidSelectable(true));
    return () => cancelAnimationFrame(frame);
  }, [plainText]);

  if (Platform.OS === 'android') {
    return (
      <Text
        selectable={androidSelectable}
        selectionColor={colors.primary}
        style={[scaledNoteBody, { color: colors.onSurface }]}
      >
        {plainText}
      </Text>
    );
  }

  return (
    <TextInput
      value={plainText}
      readOnly
      multiline
      scrollEnabled={false}
      style={[scaledNoteBody, styles.input, { color: colors.onSurface }]}
      selectionColor={colors.primary}
      underlineColorAndroid="transparent"
    />
  );
}

const styles = StyleSheet.create({
  input: {
    padding: 0,
    margin: 0,
    backgroundColor: 'transparent',
    textAlignVertical: 'top',
  },
});
