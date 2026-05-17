import React from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors } from '../theme';
import type { ParagraphAnnotations } from '../types';

type Segment = { text: string; italic: boolean };

function buildSegments(text: string, annotations: ParagraphAnnotations | null): Segment[] {
  const ranges = (annotations?.italics ?? [])
    .slice()
    .sort((a, b) => a.start - b.start);

  if (ranges.length === 0) return [{ text, italic: false }];

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { start, end } of ranges) {
    if (cursor < start) segments.push({ text: text.slice(cursor, start), italic: false });
    segments.push({ text: text.slice(start, end), italic: true });
    cursor = end;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), italic: false });

  return segments;
}

type Props = {
  text: string;
  annotations: ParagraphAnnotations | null;
  style?: object;
  prefix?: React.ReactNode;
};

export default function ParagraphRenderer({ text, annotations, style, prefix }: Props) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const segments = buildSegments(text, annotations);

  return (
    <Text style={[styles.base, style]}>
      {prefix}
      {segments.map((seg, i) =>
        seg.italic ? (
          <Text key={i} style={[styles.italic, { color: colors.tertiary }]}>{seg.text}</Text>
        ) : (
          <Text key={i}>{seg.text}</Text>
        ),
      )}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontSize: 17,
    lineHeight: 28,
    textAlign: 'justify',
  },
  italic: {
    fontStyle: 'italic',
  },
});
