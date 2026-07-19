import type Turn from '@/data/db/models/Turn';

const CHARS_PER_TOKEN = 4;
const SYSTEM_PROMPT_TOKENS_ESTIMATE = 800;

function estimateTokens(text: string | null | undefined): number {
  if (!text) return 0;
  return Math.max(0, Math.floor(text.length / CHARS_PER_TOKEN));
}

/**
 * Welle 5b — Client-Fallback-Schätzung des Kontextverbrauchs, solange kein
 * `context_meta` vom Server vorliegt (z. B. direkt nach dem Laden eines
 * Gesprächs). Turns bis `compressedUpToTurnIndex` sind bereits durch die
 * serverseitige Zusammenfassung ersetzt und zählen nicht mehr mit.
 */
export function computeEffectiveContextTokens(
  turns: Turn[],
  compressedUpToTurnIndex?: number | null,
): number {
  const relevant = compressedUpToTurnIndex != null
    ? turns.filter((t) => (t.turnIndex ?? 0) > compressedUpToTurnIndex)
    : turns;
  let total = SYSTEM_PROMPT_TOKENS_ESTIMATE;
  for (const turn of relevant) {
    total += estimateTokens(turn.userMessage);
    total += estimateTokens(turn.assistantMessage);
  }
  return total;
}
