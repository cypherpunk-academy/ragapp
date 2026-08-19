#!/usr/bin/env node
/**
 * Syncs corpus tables from ragrun-production to reniets-dev
 * via Supabase REST API (no direct DB access needed).
 *
 * Tables synced: rag_chunks, rag_paragraphs, app_paragraph_chunk,
 *                rag_references, rag_sources, rag_talks,
 *                app_starter_prompts, llm_pricing
 *
 * Usage: node scripts/sync_prod_to_dev.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../../ragrun');

// Load env files (.env then .env.dev — later values win)
const env = {};
for (const file of ['.env', '.env.dev']) {
  try {
    for (const line of readFileSync(resolve(ROOT, file), 'utf8').split('\n')) {
      const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
  } catch { /* optional */ }
}

const PROD_URL  = 'https://rmdqihhjjyizbuhxkxhn.supabase.co';
const PROD_KEY  = env['RAGRUN_SUPABASE_SERVICE_ROLE_KEY_PROD'] ?? (() => { throw new Error('RAGRUN_SUPABASE_SERVICE_ROLE_KEY_PROD not set in .env'); })();
const DEV_URL   = env['RAGRUN_SUPABASE_URL']  ?? (() => { throw new Error('RAGRUN_SUPABASE_URL not set in .env.dev'); })();
const DEV_KEY   = env['RAGRUN_SUPABASE_SERVICE_ROLE_KEY'] ?? (() => { throw new Error('RAGRUN_SUPABASE_SERVICE_ROLE_KEY not set in .env.dev'); })();

const prod = createClient(PROD_URL, PROD_KEY, { auth: { persistSession: false } });
const dev  = createClient(DEV_URL,  DEV_KEY,  { auth: { persistSession: false } });

// Tables and their primary key columns (for upsert)
// Set only: re-run only specific tables by setting SYNC_TABLES env var (comma-separated)
const ALL_TABLES = [
  { name: 'rag_sources',          pk: ['id'] },
  { name: 'rag_chunks',           pk: ['rag_partition', 'chunk_id'] },
  { name: 'rag_paragraphs',       pk: ['id'],   skipCols: ['lemma_fingerprint'] },
  { name: 'app_paragraph_chunk',  pk: ['paragraph_id', 'chunk_id', 'rag_partition'] },
  { name: 'rag_references',       pk: ['ref_id'] },
  { name: 'rag_talks',            pk: ['talk_id'] },
  { name: 'app_starter_prompts',  pk: ['id'] },
  { name: 'llm_pricing',          pk: ['model'] },
];

const onlyTables = process.env.SYNC_TABLES?.split(',').map(s => s.trim());
const TABLES = onlyTables ? ALL_TABLES.filter(t => onlyTables.includes(t.name)) : ALL_TABLES;

const PAGE_SIZE = 1000;

async function fetchAll(client, table, orderCol = 'created_at') {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .order(orderCol, { ascending: true })
      .range(from, from + PAGE_SIZE - 1);
    if (error) {
      // fallback: try without order if column doesn't exist
      const { data: data2, error: err2 } = await client
        .from(table)
        .select('*')
        .range(from, from + PAGE_SIZE - 1);
      if (err2) throw new Error(`fetch ${table} @${from}: ${err2.message}`);
      if (!data2?.length) break;
      rows.push(...data2);
      process.stdout.write(`\r   fetched ${rows.length} rows...`);
      if (data2.length < PAGE_SIZE) break;
    } else {
      if (!data?.length) break;
      rows.push(...data);
      process.stdout.write(`\r   fetched ${rows.length} rows...`);
      if (data.length < PAGE_SIZE) break;
    }
    from += PAGE_SIZE;
  }
  return rows;
}

async function upsertAll(client, table, rows, pkCols, skipCols = []) {
  const BATCH = 500;
  let done = 0;
  const filtered = skipCols.length
    ? rows.map(r => { const c = { ...r }; for (const k of skipCols) delete c[k]; return c; })
    : rows;
  for (let i = 0; i < filtered.length; i += BATCH) {
    const batch = filtered.slice(i, i + BATCH);
    const { error } = await client
      .from(table)
      .upsert(batch, { onConflict: pkCols.join(',') });
    if (error) throw new Error(`upsert ${table} @${i}: ${error.message}`);
    done += batch.length;
    process.stdout.write(`\r   upserted ${done}/${rows.length} rows...`);
  }
}

console.log('🔄 Syncing corpus tables: ragrun-production → reniets-dev\n');

for (const { name, pk, skipCols } of TABLES) {
  process.stdout.write(`📦 ${name}\n   fetching from prod...`);
  let rows;
  try {
    rows = await fetchAll(prod, name);
  } catch (e) {
    console.log(`\n   ⚠️  skip (${e.message})`);
    continue;
  }
  console.log(`\n   → ${rows.length} rows`);
  if (rows.length === 0) continue;

  process.stdout.write(`   upserting into dev...`);
  try {
    await upsertAll(dev, name, rows, pk, skipCols ?? []);
  } catch (e) {
    console.log(`\n   ❌ ${e.message}`);
    continue;
  }
  console.log(`\n   ✅ done\n`);
}

console.log('✅ Sync complete.');
