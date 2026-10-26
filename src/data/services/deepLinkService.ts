/**
 * Step 14d: Parse passage/text deep links from Universal Links and custom scheme.
 *
 * Supported URL patterns:
 *   https://api.ragxxx.com/passage/{paragraph_id}
 *   https://staging.ragxxx.com/passage/{paragraph_id}
 *   ragapp://passage/{paragraph_id}
 *   https://api.ragxxx.com/text/{note_id}
 *   https://staging.ragxxx.com/text/{note_id}
 *   ragapp://text/{note_id}
 */

export type DeepLinkTarget =
  | { kind: 'passage'; paragraphId: string }
  | { kind: 'text'; noteId: string }
  | null;

const KNOWN_HOSTS = ['api.ragxxx.com', 'staging.ragxxx.com'];

export function parseDeepLink(url: string): DeepLinkTarget {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }

  // Custom scheme: ragapp://passage/{id} or ragapp://text/{id}
  if (parsed.protocol === 'ragapp:') {
    const path = parsed.hostname + parsed.pathname; // hostname = first segment for custom schemes
    return matchPath(path);
  }

  // Universal Link: https://api.ragxxx.com/passage/{id}
  if (parsed.protocol === 'https:' && KNOWN_HOSTS.includes(parsed.hostname)) {
    return matchPath(parsed.pathname);
  }

  return null;
}

function matchPath(path: string): DeepLinkTarget {
  const clean = path.replace(/^\/+/, '').replace(/\/+$/, '');
  const segments = clean.split('/');

  if (segments.length === 2 && segments[0] === 'passage' && segments[1]) {
    return { kind: 'passage', paragraphId: segments[1] };
  }

  if (segments.length === 2 && segments[0] === 'text' && segments[1]) {
    return { kind: 'text', noteId: segments[1] };
  }

  return null;
}
