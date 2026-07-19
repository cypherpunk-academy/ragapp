import React from 'react';
import { Text, StyleSheet, type TextStyle } from 'react-native';
import { parseMdInline } from '@/shared/lib/parseMdInline';

type Props = {
  text: string;
  style?: TextStyle | TextStyle[];
};

/** Inline Markdown: `**bold**`, `*italic*`, `_underline_`. */
export default function InlineMdText({ text, style }: Props) {
  const segs = parseMdInline(text);
  return (
    <Text style={style}>
      {segs.map((seg, i) => (
        <Text
          key={i}
          style={[
            seg.bold && styles.bold,
            seg.italic && styles.italic,
            seg.underline && styles.underline,
          ]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
  underline: { textDecorationLine: 'underline' },
});
