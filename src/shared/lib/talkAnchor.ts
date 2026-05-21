import type Talk from '@/data/db/models/Talk';

/** Turn-Index der Fundstelle (aus kontext_meta), Standard 0. */
export function getTalkAnchorTurnIndex(talk: Talk): number {
  try {
    if (!talk.kontextMeta) return 0;
    const meta = JSON.parse(talk.kontextMeta) as Record<string, unknown>;
    const raw = meta?.anchor_turn_index;
    if (raw == null || raw === '') return 0;
    const n = Number.parseInt(String(raw), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  } catch {
    return 0;
  }
}
