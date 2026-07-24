import type { ColorScheme } from '@/shared/theme';
import { colorWithAlpha } from './color';

/** Bundled assistant — mirrors ragkeep/assistants/philo-von-freisinn/assistant-manifest.yaml */
export const assistant = {
  slug: 'philo-von-freisinn',
  /** Ausgeschriebener Name (z. B. „Philo von Freisinn“, „Maria vom Turm“). */
  name: 'Philo von Freisinn',
  firstName: 'Philo',
} as const;

/** Anzeigenamen für Turn-/Talk-Persönlichkeiten. */
const PERSONALITY_LABELS: Record<string, string> = {
  sokrates: 'Sokrates',
  socrates: 'Sokrates',
  'der-machtarchitekt': 'Der Machtarchitekt',
  'assistant-host': assistant.name,
  'assistant-host-deep': assistant.name,
};

export function personalityLabel(slug: string | null | undefined): string {
  if (!slug) return 'KI';
  return PERSONALITY_LABELS[slug] ?? slug;
}

/** Akzent für Philo-Tab: Hellmodus onErrorContainer, Darkmode helleres error (#FFB4AB). */
export function assistantAccentColor(colors: ColorScheme, isDark: boolean, isActive = true): string {
  const base = isDark ? colors.error : colors.onErrorContainer;
  return isActive ? base : colorWithAlpha(base, 0.5);
}
