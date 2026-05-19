import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ICON_SIZES, type IconSizeKey, type MaterialIconName } from '../theme';

type Props = {
  name: MaterialIconName;
  size?: number | IconSizeKey;
  color: string;
  style?: ComponentProps<typeof MaterialIcons>['style'];
};

export default function AppIcon({ name, size = 'strip', color, style }: Props) {
  const px = typeof size === 'number' ? size : ICON_SIZES[size];
  return <MaterialIcons name={name} size={px} color={color} style={style} />;
}
