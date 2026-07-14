import { NoteRepository } from '@/data/repositories/NoteRepository';
import { MAX_DOCUMENT_CHARS } from '@/data/lib/documentLimits';
import {
  updateParagraph, updateSection, updateHeading, insertParagraphAfter, deleteParagraph,
  type DocumentPatchResult, type HeadingPath, type ParagraphId,
} from '@/data/lib/documentTree';
import { documentUndoStack } from './documentUndoStack';
import type Note from '@/data/db/models/Note';

export type DocumentUpdateOperation =
  | 'update_paragraph'
  | 'update_section'
  | 'update_heading'
  | 'insert_paragraph_after'
  | 'delete_paragraph';

/** `update_document`-Payload (Contract §4.3) — `result_key: "suggested_document_update"`. */
export type SuggestedDocumentUpdatePayload = {
  document_id: string;
  operation: DocumentUpdateOperation;
  paragraph_id?: ParagraphId | null;
  heading_path?: HeadingPath | null;
  content?: string | null;
  summary_for_chat?: string;
};

export type ApplyDocumentUpdateResult = {
  note: Note;
  applied: boolean;
};

/**
 * `suggested_document_update` (Contract §4.3/§5) → `documentTree`-Patch → `NoteRepository.update`.
 * Legt vor dem Patch den vorherigen Stand auf `documentUndoStack` (max. 1 Eintrag, § 5.4).
 */
export async function applyDocumentUpdate(
  note: Note,
  payload: SuggestedDocumentUpdatePayload,
): Promise<ApplyDocumentUpdateResult> {
  const previousContent = note.content;
  const text = payload.content ?? '';
  let result: DocumentPatchResult;

  switch (payload.operation) {
    case 'update_paragraph':
      result = payload.paragraph_id
        ? updateParagraph(previousContent, payload.paragraph_id, text)
        : { content: previousContent, applied: false };
      break;
    case 'insert_paragraph_after':
      result = payload.paragraph_id
        ? insertParagraphAfter(previousContent, payload.paragraph_id, text)
        : { content: previousContent, applied: false };
      break;
    case 'delete_paragraph':
      result = payload.paragraph_id
        ? deleteParagraph(previousContent, payload.paragraph_id)
        : { content: previousContent, applied: false };
      break;
    case 'update_section':
      result = payload.heading_path
        ? updateSection(previousContent, payload.heading_path, text)
        : { content: previousContent, applied: false };
      break;
    case 'update_heading':
      result = payload.heading_path
        ? updateHeading(previousContent, payload.heading_path, text)
        : { content: previousContent, applied: false };
      break;
    default:
      result = { content: previousContent, applied: false };
  }

  if (!result.applied) return { note, applied: false };

  documentUndoStack.push(note.id, previousContent);
  const nextContent = result.content.slice(0, MAX_DOCUMENT_CHARS);
  const updated = await NoteRepository.update(note, nextContent);
  return { note: updated, applied: true };
}
