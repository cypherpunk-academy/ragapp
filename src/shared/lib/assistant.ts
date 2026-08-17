import type { ColorScheme } from '@/shared/theme';
import i18n from '@/shared/i18n';
import { colorWithAlpha } from './color';

/** Bundled assistant — mirrors ragkeep/assistants/philo-von-freisinn/assistant-manifest.yaml */
export const assistant = {
  slug: 'philo-von-freisinn',
  /** Ausgeschriebener Name (z. B. „Philo von Freisinn“, „Maria vom Turm“). */
  name: 'Philo von Freisinn',
  firstName: 'Philo',
} as const;

export function personalityLabel(slug: string | null | undefined): string {
  if (!slug) return i18n.t('common.ki');
  if (slug === 'sokrates' || slug === 'socrates') return i18n.t('chat.personalities.sokrates');
  if (slug === 'der-machtarchitekt') return i18n.t('chat.personalities.derMachtarchitekt');
  if (slug === 'assistant-host' || slug === 'assistant-host-deep') return assistant.name;
  return slug;
}

/** Akzent für Philo-Tab: Hellmodus onErrorContainer, Darkmode helleres error (#FFB4AB). */
export function assistantAccentColor(colors: ColorScheme, isDark: boolean, isActive = true): string {
  const base = isDark ? colors.error : colors.onErrorContainer;
  return isActive ? base : colorWithAlpha(base, 0.5);
}
