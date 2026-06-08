#!/usr/bin/env node
/**
 * Fetches a full read-only snapshot from Supabase and writes it to
 * assets/seed/db-snapshot.json for bundling with the app.
 *
 * Run before each release build:
 *   node scripts/fetch-db-seed.mjs
 *
 * Required env vars (in .env or environment):
 *   EXPO_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY   (never expose this in the app bundle!)
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
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

const toMs = (iso) => iso ? new Date(iso).getTime() : null;

// Query tables directly — pull_changes requires auth.uid() which the service
// role key does not provide. Direct queries bypass RLS via the service role.
console.log('Fetching rag_sources…');
const { data: sourcesData, error: srcErr } = await supabase
  .from('rag_sources')
  .select('id, title, author, language, year, book_index, is_primary, sort_order, created_at, updated_at');

if (srcErr) {
  console.error('rag_sources query failed:', srcErr.message);
  process.exit(1);
}

console.log('Fetching rag_paragraphs…');
const paragraphsData = [];
let from = 0;
const PAGE = 1000;
while (true) {
  const { data, error } = await supabase
    .from('rag_paragraphs')
    .select('id, source_id, language, segment_index, segment_title, paragraph_number, text_raw, annotations, deprecated_at, created_at, updated_at')
    .range(from, from + PAGE - 1);
  if (error) {
    console.error('rag_paragraphs query failed:', error.message);
    process.exit(1);
  }
  paragraphsData.push(...data);
  if (data.length < PAGE) break;
  from += PAGE;
}

const mapSource = (r) => ({
  id: r.id,
  title: r.title,
  author: r.author ?? '',
  language: r.language ?? null,
  year: r.year ?? null,
  book_index: r.book_index ?? null,
  is_primary: r.is_primary ?? false,
  sort_order: r.sort_order ?? 9999,
  created_at: toMs(r.created_at),
  updated_at: toMs(r.updated_at),
});

const mapParagraph = (r) => ({
  id: r.id,
  source_id: r.source_id,
  language: r.language ?? null,
  segment_index: r.segment_index,
  segment_title: r.segment_title,
  paragraph_number: r.paragraph_number,
  text_raw: r.text_raw,
  annotations: r.annotations != null ? JSON.stringify(r.annotations) : null,
  deprecated_at: toMs(r.deprecated_at),
  created_at: toMs(r.created_at),
  updated_at: toMs(r.updated_at),
});

// All records go in "created" — this is a full snapshot, not a delta.
const snapshot = {
  timestamp: Date.now(),
  changes: {
    sources:    { created: sourcesData.map(mapSource),    updated: [], deleted: [] },
    paragraphs: { created: paragraphsData.map(mapParagraph), updated: [], deleted: [] },
  },
};

const outDir  = resolve(ROOT, 'assets/seed');
const outPath = resolve(outDir, 'db-snapshot.json');
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, JSON.stringify(snapshot));

const s  = snapshot.changes.sources.created.length;
const p  = snapshot.changes.paragraphs.created.length;
const kb = Math.round(JSON.stringify(snapshot).length / 1024);
console.log(`✓ db-snapshot.json — ${s} sources, ${p} paragraphs — ${kb} KB  (timestamp: ${snapshot.timestamp})`);
