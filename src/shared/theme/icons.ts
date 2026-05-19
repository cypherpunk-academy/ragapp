/**
 * Icon registry — keep in sync with design/icons.json
 * @see design/icons.md
 */
import type { ComponentProps } from 'react';
import type { MaterialIcons } from '@expo/vector-icons';
import { lightColors } from './generated';

export type ColorScheme = typeof lightColors;

export type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

/** Semantic keys → Expo MaterialIcons names */
export const ICONS = {
  contribution: {
    notes: 'edit' as MaterialIconName,
    conversations: 'chat-bubble-outline' as MaterialIconName,
    rag: 'my-location' as MaterialIconName,
  },
  nav: {
    back: 'chevron-left' as MaterialIconName,
    forward: 'chevron-right' as MaterialIconName,
    expandSummary: 'expand-more' as MaterialIconName,
    collapseSummary: 'expand-less' as MaterialIconName,
  },
  tab: {
    search: 'search' as MaterialIconName,
    overview: 'dashboard' as MaterialIconName,
    read: 'menu-book' as MaterialIconName,
    chat: 'chat' as MaterialIconName,
  },
  context: {
    paragraph: 'format-paragraph' as MaterialIconName,
    work: 'auto-stories' as MaterialIconName,
    lecture: 'mic' as MaterialIconName,
    quote: 'format-quote' as MaterialIconName,
    summary: 'summarize' as MaterialIconName,
  },
  status: {
    offline: 'cloud-off' as MaterialIconName,
  },
  account: {
    avatar: 'person' as MaterialIconName,
  },
  action: {
    close: 'close' as MaterialIconName,
  },
} as const;

export const ICON_SIZES = {
  strip: 16,
  menu: 18,
  tabHeader: 20,
  appBar: 24,
  tabBar: 24,
  hero: 40,
} as const;

export type IconSizeKey = keyof typeof ICON_SIZES;
export type ContributionKind = keyof typeof ICONS.contribution;

export function contributionIcon(kind: ContributionKind): MaterialIconName {
  return ICONS.contribution[kind];
}

export type IconColorRole = 'default' | 'active';

export function iconColor(colors: ColorScheme, role: IconColorRole = 'default'): string {
  return role === 'active' ? colors.primary : colors.onSurfaceVariant;
}
