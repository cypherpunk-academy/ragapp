import { fetch as expoFetch } from 'expo/fetch';

import { assertRagrunConfigured, config } from './config';
import { getAccessToken } from './supabase';

export class RagrunApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'RagrunApiError';
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  authenticated?: boolean;
};

export async function ragrunRequest<T>(
  path: string,
  { method = 'GET', body, authenticated = true }: RequestOptions = {},
): Promise<T> {
  assertRagrunConfigured();

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (authenticated) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${config.ragrun.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  let parsed: unknown;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!response.ok) {
    const detail =
      typeof parsed === 'object' && parsed !== null && 'detail' in parsed
        ? String((parsed as { detail: unknown }).detail)
        : response.statusText;
    throw new RagrunApiError(detail || `HTTP ${response.status}`, response.status, parsed);
  }

  return parsed as T;
}

/** Parst `data: <json>\n\n`-SSE-Frames (ignoriert `: ping`-Kommentarzeilen und leere Frames). */
function* parseSseFrames(buffer: string): Generator<string> {
  const frames = buffer.split('\n\n');
  for (const frame of frames) {
    const dataLines = frame
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart());
    if (dataLines.length > 0) {
      yield dataLines.join('\n');
    }
  }
}

/**
 * Streaming-Request über `expo/fetch` (echter `ReadableStream`-Body, im Gegensatz zum
 * gepufferten RN-Global-`fetch`). Für `POST /app/chat/stream` (Filo §11.5, SSE via
 * sse-starlette — Contract §5/§6).
 */
export async function* ragrunStream<T>(
  path: string,
  { method = 'POST', body, authenticated = true, signal }: RequestOptions & { signal?: AbortSignal } = {},
): AsyncGenerator<T> {
  assertRagrunConfigured();

  const headers: Record<string, string> = {
    Accept: 'text/event-stream',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (authenticated) {
    const token = await getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const url = `${config.ragrun.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const response = await expoFetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => '');
    throw new RagrunApiError(text || `HTTP ${response.status}`, response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // sse-starlette terminiert Events mit `\r\n\r\n` — normalisieren, bevor wir auf `\n\n` splitten.
      buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');
      const parts = buffer.split('\n\n');
      buffer = parts.pop() ?? '';

      for (const part of parts) {
        for (const data of parseSseFrames(`${part}\n\n`)) {
          if (data.startsWith(':')) continue; // keepalive comment
          try {
            yield JSON.parse(data) as T;
          } catch {
            // malformed frame — ignore
          }
        }
      }
    }

    if (buffer.trim()) {
      for (const data of parseSseFrames(`${buffer}\n\n`)) {
        if (data.startsWith(':')) continue;
        try {
          yield JSON.parse(data) as T;
        } catch {
          // malformed frame — ignore
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
