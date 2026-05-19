import type Talk from '@/data/db/models/Talk';

/** Turn-Index der Fundstelle (aus context_ids), Standard 0. */
export function getTalkAnchorTurnIndex(talk: Talk): number {
  const raw = talk.contextIds?.anchor_turn_index;
  if (raw == null || raw === '') return 0;
  const n = Number.parseInt(String(raw), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
