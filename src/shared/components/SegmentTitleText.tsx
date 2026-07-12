import React, { useMemo } from 'react';
import { Text, type TextProps, type TextStyle } from 'react-native';
import { buildSegmentTitleParts } from '@/shared/lib/segmentTitleDisplay';
import { textStyles } from '@/shared/theme';

const ITALIC_COLOR = '#B25738';

type Props = TextProps & {
  title: string;
  style?: TextStyle | TextStyle[];
  italicStyle?: TextStyle;
};

/** Renders segment/chapter titles; parses legacy inline HTML (`<i>`, `<I>`, `<q>`). */
export default function SegmentTitleText({
  title,
  style,
  italicStyle,
  ...textProps
}: Props) {
  const parts = useMemo(() => buildSegmentTitleParts(title), [title]);

  return (
    <Text style={style} {...textProps}>
      {parts.map((part, i) =>
        part.italic ? (
          <Text
            key={i}
            style={[textStyles.readingItalic, { color: ITALIC_COLOR }, italicStyle]}
          >
            {part.text}
          </Text>
        ) : (
          <Text key={i}>{part.text}</Text>
        ),
      )}
    </Text>
  );
}
