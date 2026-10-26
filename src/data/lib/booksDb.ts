/**
 * Offline book cache backed by a bundled SQLite database (books.db).
 *
 * The database is generated at build time via `yarn seed:fetch` and
 * copied from the app bundle into the document directory on first launch.
 *
 * OTA updates: `checkForUpdate()` compares local PRAGMA user_version
 * against the server's `/app/corpus-version` and downloads a new DB
 * in the background when a newer version is available.
 *
 * All reads are local — no network required.
 */
import {
  openDatabaseAsync,
  importDatabaseFromAssetAsync,
  type SQLiteDatabase,
} from 'expo-sqlite';
import { Paths, File as ExpoFile, Directory } from 'expo-file-system';
import { config } from './config';

// metro resolves the .db asset at build time
// eslint-disable-next-line @typescript-eslint/no-var-requires
const BOOKS_DB_ASSET = require('../../../assets/seed/books.db');
const DB_NAME = 'books.db';

// --------------------------------------------------------------------------
// Types
// --------------------------------------------------------------------------

export type Source = {
  id: string;
  title: string;
  author: string;
  language: string | null;
  year: number | null;
  book_index: number | null;
  is_primary: number; // 0 | 1
  sort_order: number;
};

export type Paragraph = {
  id: string;
  source_id: string;
  segment_index: number;
  segment_slug: string | null;
  segment_title: string | null;
  paragraph_number: number;
  text_raw: string;
  annotations: string | null;
  language: string | null;
};

export type PassageRedirect = {
  old_id: string;
  new_id: string;
  corpus_version: number;
  kind: string;
  old_text: string | null;
};

export type ResolvedPassage =
  | { found: true; paragraph: Paragraph }
  | { found: false; redirect: PassageRedirect }
  | { found: false; redirect: null };

// --------------------------------------------------------------------------
// Singleton database handle
// --------------------------------------------------------------------------

let _db: SQLiteDatabase | null = null;
let _initPromise: Promise<SQLiteDatabase> | null = null;

async function initDb(): Promise<SQLiteDatabase> {
  await importDatabaseFromAssetAsync(DB_NAME, { assetId: BOOKS_DB_ASSET });
  const db = await openDatabaseAsync(DB_NAME, { useNewConnection: false });
  return db;
}

function getDb(): Promise<SQLiteDatabase> {
  if (_db) return Promise.resolve(_db);
  if (!_initPromise) {
    _initPromise = initDb().then((db) => {
      _db = db;
      return db;
    });
  }
  return _initPromise;
}

// --------------------------------------------------------------------------
// Public API
// --------------------------------------------------------------------------

export async function getSources(): Promise<Source[]> {
  const db = await getDb();
  return db.getAllAsync<Source>('SELECT * FROM sources ORDER BY sort_order, title');
}

export async function getParagraph(id: string): Promise<Paragraph | null> {
  const db = await getDb();
  return db.getFirstAsync<Paragraph>('SELECT * FROM paragraphs WHERE id = ?', id);
}

export async function getParagraphsBySource(sourceId: string): Promise<Paragraph[]> {
  const db = await getDb();
  return db.getAllAsync<Paragraph>(
    'SELECT * FROM paragraphs WHERE source_id = ? ORDER BY segment_index, paragraph_number',
    sourceId,
  );
}

export async function getParagraphsBySegment(
  sourceId: string,
  segmentIndex: number,
): Promise<Paragraph[]> {
  const db = await getDb();
  return db.getAllAsync<Paragraph>(
    'SELECT * FROM paragraphs WHERE source_id = ? AND segment_index = ? ORDER BY paragraph_number',
    sourceId,
    segmentIndex,
  );
}

export async function getCorpusVersion(): Promise<number> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  return row?.user_version ?? 0;
}

/**
 * Resolve a paragraph ID through the passage_redirect chain.
 *
 * In 1.0 the redirect table is empty, so this is a pass-through:
 * look up the paragraph directly.
 */
export async function resolveRedirect(id: string): Promise<ResolvedPassage> {
  const db = await getDb();

  // Fast path: direct hit
  const paragraph = await db.getFirstAsync<Paragraph>(
    'SELECT * FROM paragraphs WHERE id = ?',
    id,
  );
  if (paragraph) return { found: true, paragraph };

  // Follow redirect chain (max 10 hops to prevent loops)
  let currentId = id;
  let redirect: PassageRedirect | null = null;
  for (let i = 0; i < 10; i++) {
    redirect = await db.getFirstAsync<PassageRedirect>(
      'SELECT * FROM passage_redirect WHERE old_id = ?',
      currentId,
    );
    if (!redirect) break;
    if (redirect.kind === 'deleted') return { found: false, redirect };
    // Follow chain for 'merged'
    const target = await db.getFirstAsync<Paragraph>(
      'SELECT * FROM paragraphs WHERE id = ?',
      redirect.new_id,
    );
    if (target) return { found: true, paragraph: target };
    currentId = redirect.new_id;
  }

  return { found: false, redirect };
}

// --------------------------------------------------------------------------
// OTA corpus update
// --------------------------------------------------------------------------

type CorpusVersionResponse = {
  version: number;
  download_url: string | null;
};

export type UpdateResult =
  | { updated: true; from: number; to: number }
  | { updated: false; reason: string };

/**
 * Check the server for a newer corpus version and download it if available.
 *
 * The caller is responsible for scheduling this (e.g. on app foreground).
 * Reads continue from the current DB while downloading; the swap happens
 * only after a complete, verified download.
 */
export async function checkForUpdate(): Promise<UpdateResult> {
  if (!config.ragrun.isConfigured) {
    return { updated: false, reason: 'ragrun not configured' };
  }

  const localVersion = await getCorpusVersion();

  let remote: CorpusVersionResponse;
  try {
    const res = await fetch(`${config.ragrun.baseUrl}/app/corpus-version`);
    if (!res.ok) return { updated: false, reason: `server ${res.status}` };
    remote = await res.json() as CorpusVersionResponse;
  } catch {
    return { updated: false, reason: 'network error' };
  }

  if (remote.version <= localVersion) {
    return { updated: false, reason: 'up to date' };
  }

  if (!remote.download_url) {
    return { updated: false, reason: 'no download url' };
  }

  // Download to a temporary name inside the SQLite directory
  // (openDatabaseAsync only looks in Documents/SQLite/)
  const TEMP_DB_NAME = 'books-update.db';
  const tmpInSqlite = new ExpoFile(Paths.document, 'SQLite', TEMP_DB_NAME);
  try {
    if (tmpInSqlite.exists) tmpInSqlite.delete();
    await ExpoFile.downloadFileAsync(remote.download_url, tmpInSqlite);
  } catch {
    return { updated: false, reason: 'download failed' };
  }

  // Verify the downloaded DB is readable and has the expected version
  let newDb: SQLiteDatabase;
  try {
    newDb = await openDatabaseAsync(TEMP_DB_NAME, { useNewConnection: true });
    const row = await newDb.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
    const dlVersion = row?.user_version ?? 0;
    if (dlVersion !== remote.version) {
      await newDb.closeAsync();
      return { updated: false, reason: `version mismatch: expected ${remote.version}, got ${dlVersion}` };
    }
    await newDb.closeAsync();
  } catch {
    return { updated: false, reason: 'downloaded db invalid' };
  }

  // Swap: close current DB, replace downloaded over active
  if (_db) {
    await _db.closeAsync();
    _db = null;
    _initPromise = null;
  }

  const targetFile = new ExpoFile(Paths.document, 'SQLite', DB_NAME);
  try {
    tmpInSqlite.move(targetFile);
  } catch {
    // Re-init from whatever is there
    _initPromise = null;
    await getDb();
    return { updated: false, reason: 'file swap failed' };
  }

  // Reopen with the new DB
  const db = await openDatabaseAsync(DB_NAME, { useNewConnection: false });
  _db = db;
  _initPromise = Promise.resolve(db);

  return { updated: true, from: localVersion, to: remote.version };
}
