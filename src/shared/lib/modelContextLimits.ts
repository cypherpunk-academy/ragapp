/** Welle 5b — Kontextfenster-Grenzen je Modell (Filo §11.4). Nur für die
 * Client-Fallback-Schätzung, bis `context_meta` vom Server eintrifft. */
export const DEEPSEEK_V4_CONTEXT_TOKENS = 1_000_000;
export const DEEPSEEK_V4_OUTPUT_TOKENS = 384_000;

export function contextLimitForModel(_model?: string | null): number {
  return DEEPSEEK_V4_CONTEXT_TOKENS;
}
