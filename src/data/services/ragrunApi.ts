import { config } from '@/data/lib/config';
import { ragrunRequest, ragrunStream } from '@/data/lib/ragrun-client';
import type {
  ChatCompressResponse,
  ChatRequest,
  ChatResponse,
  ChatStreamEvent,
  ChatSummarizeResponse,
  ChunkTextResponse,
  PersonalitiesResponse,
  RagrunHealthResponse,
  SearchRequest,
  SearchResponse,
  SegmentsResponse,
  SourcesResponse,
} from '@/shared/types/ragrun';

const APP_PREFIX = '/app';

export const ragrunApi = {
  isAvailable(): boolean {
    return config.ragrun.isConfigured;
  },

  async health(): Promise<RagrunHealthResponse> {
    return ragrunRequest<RagrunHealthResponse>(`${APP_PREFIX}/health`, {
      authenticated: false,
    });
  },

  async search(request: SearchRequest): Promise<SearchResponse> {
    return ragrunRequest<SearchResponse>(`${APP_PREFIX}/search`, {
      method: 'POST',
      body: request,
      authenticated: false,
    });
  },

  /** Optional: Chunk-Volltext nachladen, falls `POST /app/search` kein `text` liefert. */
  async getChunk(chunkId: string, sourceId?: string): Promise<ChunkTextResponse> {
    const q = sourceId ? `?source_id=${encodeURIComponent(sourceId)}` : '';
    return ragrunRequest<ChunkTextResponse>(
      `${APP_PREFIX}/chunks/${encodeURIComponent(chunkId)}${q}`,
    );
  },

  async getSources(): Promise<SourcesResponse> {
    return ragrunRequest<SourcesResponse>(`${APP_PREFIX}/sources`);
  },

  async getSegments(sourceId: string): Promise<SegmentsResponse> {
    return ragrunRequest<SegmentsResponse>(`${APP_PREFIX}/sources/${sourceId}/segments`);
  },

  async getPersonalities(): Promise<PersonalitiesResponse> {
    return ragrunRequest<PersonalitiesResponse>(`${APP_PREFIX}/personalities`, {
      authenticated: false,
    });
  },

  async sendChat(request: ChatRequest): Promise<ChatResponse> {
    return ragrunRequest<ChatResponse>(`${APP_PREFIX}/chat`, {
      method: 'POST',
      body: request,
    });
  },

  /** `POST /app/chat/stream` — Filo §11.5 (RN-SSE via `expo/fetch`), Contract §5/§6. */
  streamChat(request: ChatRequest, options?: { signal?: AbortSignal }): AsyncGenerator<ChatStreamEvent> {
    return ragrunStream<ChatStreamEvent>(`${APP_PREFIX}/chat/stream`, {
      method: 'POST',
      body: request,
      signal: options?.signal,
    });
  },

  async summarizeTalk(talkId: string): Promise<ChatSummarizeResponse> {
    return ragrunRequest<ChatSummarizeResponse>(`${APP_PREFIX}/chat/${talkId}/summarize`, {
      method: 'POST',
      body: {},
    });
  },

  /** Welle 5b — „Verdichten": fasst ältere Turns zusammen, reduziert die Kontext-Anzeige. */
  async compressTalk(talkId: string): Promise<ChatCompressResponse> {
    return ragrunRequest<ChatCompressResponse>(`${APP_PREFIX}/chat/${talkId}/compress`, {
      method: 'POST',
      body: {},
    });
  },

  /** Welle 5a/5c — pinned/mode laufen nicht über den generischen Sync-Pfad (nur `notes`/`bookmarks`). */
  async updateTalkSettings(
    talkId: string,
    settings: { pinned?: boolean; mode?: string },
  ): Promise<void> {
    await ragrunRequest<void>(`${APP_PREFIX}/chat/${talkId}`, {
      method: 'PATCH',
      body: settings,
    });
  },

  /** Welle 5d — Turn-Aktionen: löscht `rag_turns` ab `fromIndex` server-seitig. */
  async deleteTurnsFrom(talkId: string, fromIndex: number): Promise<void> {
    await ragrunRequest<void>(
      `${APP_PREFIX}/chat/${talkId}/turns?after_index=${fromIndex}`,
      { method: 'DELETE' },
    );
  },
};
