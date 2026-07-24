import type Turn from '@/data/db/models/Turn';
import type Reference from '@/data/db/models/Reference';
import { resolveRagHitsForTurn, citationIndexToListIndex, type RagHit } from './ragHits';
import { splitTextWithCitations } from './citationMarkers';
import { assistant } from './assistant';

function keyForHit(hit: RagHit): string {
  return hit.chunk_id?.trim() || `${hit.title ?? ''}|${hit.segment_title ?? ''}`;
}

function labelForHit(hit: RagHit): string {
  const parts = [hit.title, hit.segment_title].filter((p): p is string => Boolean(p?.trim()));
  return parts.length > 0 ? parts.join(' — ') : (hit.snippet?.trim() || 'Unbekannte Quelle');
}

/** Baut den gesamten Gesprächsverlauf als Markdown, Zitate global dedupliziert am Ende. */
export function formatTalkAsMarkdown(
  turns: Turn[],
  referencesByTurnId: Record<string, Reference[]>,
): string {
  const lines: string[] = [];
  const globalRefs: RagHit[] = [];
  const keyToGlobalIndex = new Map<string, number>();

  const globalIndexForHit = (hit: RagHit): number => {
    const key = keyForHit(hit);
    const existing = keyToGlobalIndex.get(key);
    if (existing != null) return existing;
    globalRefs.push(hit);
    const idx = globalRefs.length;
    keyToGlobalIndex.set(key, idx);
    return idx;
  };

  for (const turn of turns) {
    if (turn.userMessage?.trim()) {
      lines.push(`**Du:** ${turn.userMessage.trim()}`, '');
    }
    if (turn.assistantMessage?.trim()) {
      const hits = resolveRagHitsForTurn(turn, referencesByTurnId[turn.id] ?? []);
      const rewritten = splitTextWithCitations(turn.assistantMessage)
        .map((seg) => {
          if (seg.kind === 'text') return seg.value;
          const hit = hits[citationIndexToListIndex(seg.index, hits)];
          return hit ? `[${globalIndexForHit(hit)}]` : seg.value;
        })
        .join('');
      lines.push(`**${assistant.name}:** ${rewritten.trim()}`, '');
    }
  }

  if (globalRefs.length > 0) {
    lines.push('---', '', '**Quellen**', '');
    globalRefs.forEach((hit, i) => lines.push(`[${i + 1}] ${labelForHit(hit)}`));
  }

  return lines.join('\n').trim();
}
