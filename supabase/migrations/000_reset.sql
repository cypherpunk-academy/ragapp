-- =============================================================================
-- RESET — drop everything created by 001/002 so they can be re-run cleanly.
-- Run this ONCE against the Supabase project before re-applying the schema.
-- =============================================================================

-- Functions
DROP FUNCTION IF EXISTS pull_changes(bigint, int) CASCADE;
DROP FUNCTION IF EXISTS push_changes(jsonb, bigint) CASCADE;
DROP FUNCTION IF EXISTS set_updated_at() CASCADE;
DROP FUNCTION IF EXISTS ms_to_ts(bigint) CASCADE;
DROP FUNCTION IF EXISTS ts_to_ms(timestamptz) CASCADE;

-- User-writable tables
DROP TABLE IF EXISTS app_bookmarks CASCADE;
DROP TABLE IF EXISTS app_notes CASCADE;
DROP TABLE IF EXISTS app_paragraph_chunk CASCADE;

-- Content tables (ragrun data)
DROP TABLE IF EXISTS rag_references CASCADE;
DROP TABLE IF EXISTS rag_turns CASCADE;
DROP TABLE IF EXISTS rag_talks CASCADE;
DROP TABLE IF EXISTS rag_chunks CASCADE;
DROP TABLE IF EXISTS rag_paragraphs CASCADE;
