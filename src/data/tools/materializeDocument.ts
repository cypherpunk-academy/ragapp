import { NoteRepository, type CreateNoteResult } from '@/data/repositories/NoteRepository';
import { MAX_DOCUMENT_CHARS } from '@/data/lib/documentLimits';

/** `create_document`-Payload (Contract §4.1) — `result_key: "suggested_document"`. */
export type SuggestedDocumentPayload = {
  title: string;
  content: string;
  summary_for_chat?: string;
};

export type MaterializeDocumentOptions = {
  talkId?: string;
  turnId?: string;
  sourceId?: string;
  segmentSlug?: string;
  paragraphId?: string;
  userId?: string;
};

function withTitleLine(payload: SuggestedDocumentPayload): string {
  return payload.content.trim().startsWith('# ')
    ? payload.content
    : `# ${payload.title}\n\n${payload.content}`;
}

/**
 * `suggested_document` (Contract §4.1/§5) → `NoteRepository.create`.
 * ragrun schreibt nicht in `app_notes` — der Client materialisiert lokal.
 */
export async function materializeDocument(
  payload: SuggestedDocumentPayload,
  options: MaterializeDocumentOptions = {},
): Promise<CreateNoteResult> {
  const content = withTitleLine(payload).slice(0, MAX_DOCUMENT_CHARS);
  return NoteRepository.create({
    userId: options.userId ?? 'local',
    content,
    talkId: options.talkId,
    turnId: options.turnId,
    sourceId: options.sourceId,
    segmentSlug: options.segmentSlug,
    paragraphId: options.paragraphId,
  });
}
