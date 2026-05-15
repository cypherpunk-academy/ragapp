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
