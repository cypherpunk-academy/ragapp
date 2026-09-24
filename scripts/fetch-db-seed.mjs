#!/usr/bin/env node
/**
 * Fetches a full read-only snapshot from Supabase and writes it to
 * assets/seed/books.db (SQLite) for bundling with the app.
 *
 * Run before each release build:
 *   node scripts/fetch-db-seed.mjs
 *
 * Required env vars (in .env or environment):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (never expose this in the app bundle!)
 */

import { createClient } from '@supabase/supabase-js';
import Database from 'better-sqlite3';
import { readFileSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// Parse .env manually (no dotenv dependency required)
const env = {};
for (const file of ['.env', '.env.local']) {
  try {
    for (const line of readFileSync(resolve(ROOT, file), 'utf8').split('\n')) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* file not present */ }
}
const get = (k) => env[k] ?? process.env[k];

const SUPABASE_URL     = get('EXPO_PUBLIC_SUPABASE_URL');
const SERVICE_ROLE_KEY = get('SUPABASE_SERVICE_ROLE_KEY');

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    'Missing env vars. Set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Fetch sources
// ---------------------------------------------------------------------------
console.log('Fetching rag_sources…');
const { data: sourcesData, error: srcErr } = await supabase
  .from('rag_sources')
  .select('id, title, author, language, year, book_index, is_primary, sort_order');

if (srcErr) {
  console.error('rag_sources query failed:', srcErr.message);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Fetch paragraphs (only non-deprecated)
// ---------------------------------------------------------------------------
console.log('Fetching rag_paragraphs (deprecated_at IS NULL)…');
const paragraphsData = [];
let from = 0;
const PAGE = 1000;
while (true) {
  const { data, error } = await supabase
    .from('rag_paragraphs')
    .select('id, source_id, language, segment_index, segment_slug, segment_title, paragraph_number, text_raw, annotations')
    .is('deprecated_at', null)
    .range(from, from + PAGE - 1);
  if (error) {
    console.error('rag_paragraphs query failed:', error.message);
    process.exit(1);
  }
  paragraphsData.push(...data);
  if (data.length < PAGE) break;
  from += PAGE;
}

// ---------------------------------------------------------------------------
// Build SQLite database
// ---------------------------------------------------------------------------
const outDir  = resolve(ROOT, 'assets/seed');
const outPath = resolve(outDir, 'books.db');
mkdirSync(outDir, { recursive: true });

const db = new Database(outPath);
db.pragma('journal_mode = OFF');
db.pragma('synchronous = OFF');

db.exec(`
  CREATE TABLE sources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    author TEXT NOT NULL DEFAULT '',
    language TEXT,
    year INTEGER,
    book_index INTEGER,
    is_primary INTEGER NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 9999
  );

  CREATE TABLE paragraphs (
    id TEXT PRIMARY KEY,
    source_id TEXT NOT NULL,
    segment_index INTEGER NOT NULL,
    segment_slug TEXT,
    segment_title TEXT,
    paragraph_number INTEGER NOT NULL,
    text_raw TEXT NOT NULL,
    annotations TEXT,
    language TEXT
  );

  CREATE TABLE passage_redirect (
    old_id TEXT PRIMARY KEY,
    new_id TEXT NOT NULL,
    corpus_version INTEGER NOT NULL,
    kind TEXT NOT NULL,
    old_text TEXT
  );

  CREATE INDEX idx_paragraphs_source ON paragraphs (source_id);
  CREATE INDEX idx_paragraphs_segment ON paragraphs (source_id, segment_index);
`);

// Insert sources
const insertSource = db.prepare(`
  INSERT INTO sources (id, title, author, language, year, book_index, is_primary, sort_order)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertParagraph = db.prepare(`
  INSERT INTO paragraphs (id, source_id, segment_index, segment_slug, segment_title, paragraph_number, text_raw, annotations, language)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertSources = db.transaction((rows) => {
  for (const r of rows) {
    insertSource.run(
      r.id,
      r.title,
      r.author ?? '',
      r.language ?? null,
      r.year ?? null,
      r.book_index ?? null,
      r.is_primary ? 1 : 0,
      r.sort_order ?? 9999,
    );
  }
});

const insertParagraphs = db.transaction((rows) => {
  for (const r of rows) {
    insertParagraph.run(
      r.id,
      r.source_id,
      r.segment_index,
      r.segment_slug ?? null,
      r.segment_title ?? null,
      r.paragraph_number,
      r.text_raw,
      r.annotations != null ? JSON.stringify(r.annotations) : null,
      r.language ?? null,
    );
  }
});

insertSources(sourcesData);
insertParagraphs(paragraphsData);

// Corpus version (increment manually when content changes)
db.pragma('user_version = 1');

db.close();

const { statSync } = await import('fs');
const bytes = statSync(outPath).size;
const mb = (bytes / (1024 * 1024)).toFixed(1);
console.log(`✓ books.db — ${sourcesData.length} sources, ${paragraphsData.length} paragraphs — ${mb} MB`);
