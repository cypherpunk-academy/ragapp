import { config } from '@/data/lib/config';
import { ragrunRequest } from '@/data/lib/ragrun-client';
import type {
  ChatRequest,
  ChatResponse,
  ChatSummarizeResponse,
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
    });
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

  async summarizeTalk(talkId: string): Promise<ChatSummarizeResponse> {
    return ragrunRequest<ChatSummarizeResponse>(`${APP_PREFIX}/chat/${talkId}/summarize`, {
      method: 'POST',
      body: {},
    });
  },
};
