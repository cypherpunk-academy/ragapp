import React from 'react';
import { View, Text, StyleSheet, useColorScheme, type TextStyle } from 'react-native';
import { lightColors, darkColors, spacing, textStyles, typography } from '@/shared/theme';
import { parseDocumentTree } from '@/data/lib/documentTree';
import { parseMdInline } from '@/shared/lib/parseMdInline';

type ColorScheme = Record<string, string>;

function InlineText({ text, style }: { text: string; style: TextStyle | TextStyle[] }) {
  const segs = parseMdInline(text);
  return (
    <Text style={style}>
      {segs.map((seg, i) => (
        <Text
          key={i}
          style={[seg.bold && styles.bold, seg.italic && styles.italic]}
        >
          {seg.text}
        </Text>
      ))}
    </Text>
  );
}

function isListBlock(text: string): boolean {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return lines.length > 0 && lines.every((l) => /^(-|\d+\.)\s+/.test(l));
}

function ListBlock({ text, colors }: { text: string; colors: ColorScheme }) {
  const items = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <View style={styles.list}>
      {items.map((item, i) => {
        const marker = item.match(/^(-|\d+\.)/)?.[1] ?? '-';
        const rest = item.replace(/^(-|\d+\.)\s+/, '');
        return (
          <View key={i} style={styles.listItem}>
            <Text style={[textStyles.noteBody, { color: colors.onSurfaceVariant }]}>
              {marker === '-' ? '•' : marker}
            </Text>
            <InlineText text={rest} style={[textStyles.noteBody, styles.listItemText, { color: colors.onSurface }]} />
          </View>
        );
      })}
    </View>
  );
}

function Block({ text, colors }: { text: string; colors: ColorScheme }) {
  return isListBlock(text)
    ? <ListBlock text={text} colors={colors} />
    : <InlineText text={text} style={[textStyles.noteBody, styles.paragraph, { color: colors.onSurface }]} />;
}

/**
 * Renderer für Arbeitstexte: Überschriften (`#`/`##`/`###`), Absätze, Listen.
 * Keine Tabellen im MVP (Filo §5.3, §5.3.1).
 */
export default function DocumentMarkdownView({ content }: { content: string }) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? darkColors : lightColors;
  const tree = parseDocumentTree(content);

  return (
    <View>
      <Text style={[textStyles.chapterTitle, styles.title, { color: colors.onBackground }]}>
        {tree.title}
      </Text>
      {tree.sections.map((section, si) => (
        <View key={si} style={styles.section}>
          {section.heading ? (
            <Text style={[typography.titleMedium, styles.sectionHeading, { color: colors.onBackground }]}>
              {section.heading.replace(/^##\s+/, '')}
            </Text>
          ) : null}
          {section.paragraphs.map((p) => <Block key={p.id} text={p.text} colors={colors} />)}
          {section.children.map((child, ci) => (
            <View key={ci} style={styles.subsection}>
              <Text style={[typography.labelLarge, styles.subsectionHeading, { color: colors.onSurfaceVariant }]}>
                {child.heading.replace(/^###\s+/, '')}
              </Text>
              {child.paragraphs.map((p) => <Block key={p.id} text={p.text} colors={colors} />)}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { marginBottom: spacing.m },
  section: { marginBottom: spacing.m, gap: spacing.s },
  sectionHeading: { marginBottom: spacing.xs },
  subsection: { marginTop: spacing.s, gap: spacing.s },
  subsectionHeading: { marginBottom: spacing.xs },
  paragraph: {},
  list: { gap: spacing.xs },
  listItem: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
  listItemText: { flex: 1 },
  bold: { fontWeight: '700' },
  italic: { fontStyle: 'italic' },
});
