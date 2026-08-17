import i18n, { getDateLocale } from '@/shared/i18n';

/** Kurzes relatives Datum — z. B. für `updated_at` in Listenzeilen. */
export function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.round(diffMs / 60_000);

  if (diffMin < 1) return i18n.t('relativeTime.justNow');
  if (diffMin < 60) return i18n.t('relativeTime.minutes', { count: diffMin });

  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return i18n.t('relativeTime.hours', { count: diffH });

  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return i18n.t('relativeTime.days', { count: diffD });

  return date.toLocaleDateString(getDateLocale(), { day: '2-digit', month: 'short', year: 'numeric' });
}
