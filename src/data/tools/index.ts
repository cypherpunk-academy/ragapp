import { NoteRepository } from '@/data/repositories/NoteRepository';
import { materializeDocument, type SuggestedDocumentPayload } from './materializeDocument';
import { applyDocumentUpdate, type SuggestedDocumentUpdatePayload } from './applyDocumentUpdate';
import type Note from '@/data/db/models/Note';

export type ToolResult =
  | { tool_id: string; result_key: 'suggested_document'; payload: SuggestedDocumentPayload }
  | { tool_id: string; result_key: 'suggested_document_update'; payload: SuggestedDocumentUpdatePayload }
  | { tool_id: string; result_key: 'document_blocks'; payload: unknown };

/** Minimaler SSE-`done`-Ausschnitt, den `dispatchToolEffects` benötigt (Contract §5). */
export type ChatDoneEvent = {
  type: 'done';
  turn_id: string;
  talk_id: string;
  tool_results?: ToolResult[];
};

export type DispatchToolEffectsOptions = {
  talkId?: string;
  turnId?: string;
  sourceId?: string;
  segmentSlug?: string;
  paragraphId?: string;
  /** Im Chat verknüpfter Arbeitstext — Ziel für `suggested_document_update`. */
  linkedNote?: Note | null;
  userId?: string;
};

export type DispatchToolEffectsResult = {
  createdNote?: Note;
  updatedNote?: Note;
  paragraphOccupied?: { existingNote: Note };
  /** `suggested_document_update` kam an, Patch ließ sich nicht anwenden (Adresse fehlt o. ä.). */
  updateFailed?: boolean;
};

/**
 * Client-Einstieg für SSE `done.tool_results[]` (Contract §5).
 * `document_blocks` erzeugt keinen DB-Write — nur Modell-Kontext, bereits in der Tool-Runde verbraucht.
 * Automatische Übernahme: kein „Übernehmen?"-Chip — Patch direkt nach `done` (§ 5.6).
 */
export async function dispatchToolEffects(
  doneEvent: ChatDoneEvent,
  options: DispatchToolEffectsOptions = {},
): Promise<DispatchToolEffectsResult> {
  const result: DispatchToolEffectsResult = {};

  for (const toolResult of doneEvent.tool_results ?? []) {
    if (toolResult.result_key === 'suggested_document') {
      const created = await materializeDocument(toolResult.payload, {
        talkId: options.talkId,
        turnId: options.turnId,
        sourceId: options.sourceId,
        segmentSlug: options.segmentSlug,
        paragraphId: options.paragraphId,
        userId: options.userId,
      });
      if (created.ok) {
        result.createdNote = created.note;
      } else if (created.reason === 'paragraph_occupied') {
        result.paragraphOccupied = { existingNote: created.existingNote };
      }
    } else if (toolResult.result_key === 'suggested_document_update') {
      const note = options.linkedNote ?? (await NoteRepository.findById(toolResult.payload.document_id));
      if (note) {
        const applied = await applyDocumentUpdate(note, toolResult.payload);
        if (applied.applied) result.updatedNote = applied.note;
        else result.updateFailed = true;
      } else {
        result.updateFailed = true;
      }
    }
  }

  return result;
}

export { materializeDocument, applyDocumentUpdate };
export type { SuggestedDocumentPayload, SuggestedDocumentUpdatePayload };
