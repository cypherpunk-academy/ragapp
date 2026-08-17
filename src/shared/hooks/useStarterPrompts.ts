import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StarterPromptRepository } from '@/data/repositories/StarterPromptRepository';

export type StarterPromptExample = { id: string; prompt: string };

function shufflePick<T>(items: T[], n: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

export function useStarterPrompts(enabled: boolean, shuffleKey: number): StarterPromptExample[] {
  const { t } = useTranslation();
  const [all, setAll] = useState<StarterPromptExample[]>([]);

  const fallback = useMemo(
    (): StarterPromptExample[] => [
      { id: 'fallback-1', prompt: t('chat.emptyFreeExample1') },
      { id: 'fallback-2', prompt: t('chat.emptyFreeExample2') },
      { id: 'fallback-3', prompt: t('chat.emptyFreeExample3') },
    ],
    [t],
  );

  useEffect(() => {
    const sub = StarterPromptRepository.observeAll().subscribe({
      next: (rows) => {
        setAll(rows.map((r) => ({ id: r.id, prompt: r.prompt })));
      },
      error: () => setAll([]),
    });
    return () => sub.unsubscribe();
  }, []);

  return useMemo(() => {
    if (!enabled) return [];
    const pool = all.length > 0 ? all : fallback;
    return shufflePick(pool, Math.min(3, pool.length));
  }, [enabled, shuffleKey, all, fallback]);
}
