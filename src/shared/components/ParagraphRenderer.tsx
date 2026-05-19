import React, { useMemo } from 'react';
import { Text, StyleSheet, useColorScheme } from 'react-native';
import { lightColors, darkColors, textStyles } from '../theme';
import type { ParagraphAnnotations } from '../types';

/** Figma Lesen/Default — rust italic (#b25738) */
const READING_ITALIC_COLOR = '#B25738';

type SegmentKind = 'plain' | 'italic' | 'quote';

type Segment = { text: string; kind: SegmentKind };

type AnnotatedRange = { start: number; end: number; kind: SegmentKind };

function buildSegments(text: string, annotations: ParagraphAnnotations | null): Segment[] {
  const ranges: AnnotatedRange[] = [
    ...(annotations?.italics ?? []).map(({ start, end }) => ({ start, end, kind: 'italic' as const })),
    ...(annotations?.foreign_quotes ?? []).map(({ start, end }) => ({ start, end, kind: 'quote' as const })),
  ].sort((a, b) => a.start - b.start || a.end - b.end);

  if (ranges.length === 0) return [{ text, kind: 'plain' }];

  const segments: Segment[] = [];
  let cursor = 0;

  for (const { start, end, kind } of ranges) {
    const from = Math.max(0, Math.min(start, text.length));
    const to = Math.max(from, Math.min(end, text.length));
    if (cursor < from) segments.push({ text: text.slice(cursor, from), kind: 'plain' });
    if (from < to) segments.push({ text: text.slice(from, to), kind });
    cursor = Math.max(cursor, to);
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), kind: 'plain' });

  return segments;
}

function isFullQuoteParagraph(text: string, annotations: ParagraphAnnotations | null): boolean {
  const quotes = annotations?.foreign_quotes ?? [];
  return quotes.some((q) => q.start === 0 && q.end >= text.length);
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
  const segments = useMemo(() => buildSegments(text, annotations), [text, annotations]);
  const fullQuote = isFullQuoteParagraph(text, annotations);

  const baseColor = fullQuote ? colors.primary : colors.onBackground;

  return (
    <Text style={[textStyles.readingBody, styles.base, { color: baseColor }, style]}>
      {prefix}
      {segments.map((seg, i) => {
        if (seg.kind === 'italic') {
          return (
            <Text key={i} style={[textStyles.readingItalic, { color: READING_ITALIC_COLOR }]}>
              {seg.text}
            </Text>
          );
        }
        if (seg.kind === 'quote') {
          const quoted = fullQuote ? seg.text : `«${seg.text}»`;
          return (
            <Text key={i} style={{ color: colors.primary }}>
              {quoted}
            </Text>
          );
        }
        return <Text key={i}>{seg.text}</Text>;
      })}
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    textAlign: 'justify',
  },
});
