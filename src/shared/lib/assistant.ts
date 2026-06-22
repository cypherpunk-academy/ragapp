import type { ColorScheme } from '@/shared/theme';
import { colorWithAlpha } from './color';

/** Bundled assistant — mirrors ragkeep/assistants/philo-von-freisinn/assistant-manifest.yaml */
export const assistant = {
  slug: 'philo-von-freisinn',
  name: 'Philo von Freisinn',
  firstName: 'Philo',
} as const;

/** Dunkelrot aus dem App-Farbprofil (Material onErrorContainer / errorContainer → #93000A). */
export function assistantAccentColor(colors: ColorScheme, isDark: boolean, isActive = true): string {
  const base = isDark ? colors.errorContainer : colors.onErrorContainer;
  return isActive ? base : colorWithAlpha(base, 0.5);
}
