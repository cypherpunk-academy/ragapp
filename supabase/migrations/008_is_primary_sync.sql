-- =============================================================================
-- Add is_primary to rag_sources and update pull_changes to include it.
-- The column was added via direct SQL but pull_changes was not updated correctly.
-- =============================================================================

-- Ensure column exists (idempotent)
ALTER TABLE rag_sources ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false;

-- Mark the 8 primary sources for philo-von-freisinn
UPDATE rag_sources SET is_primary = false;  -- reset all first
UPDATE rag_sources SET is_primary = true
WHERE id IN (
  '4b8e4c2a-3f1b-4d2e-9c4a-8e4f4b2c3a1d',  -- Die Philosophie der Freiheit #4
  'd64fa532-6040-4fc2-9c43-ed4e5368bb92',  -- Die Rätsel der Philosophie #18
  'e58f6369-f7a7-4213-845f-c5b9bf82ffe5',  -- Wahrheit und Wissenschaft #3
  '44217040-65bf-4150-9fa8-bac9c57cd1b1',  -- Grundlinien einer Erkenntnistheorie #2
  '5e6303e1-a4a4-4be4-bafd-c4c575024b8e',  -- Friedrich Nietzsche. Ein Kämpfer #5
  '64e881df-0501-4815-9b0c-6cf545c383b6',  -- Goethes Weltanschauung #6
  'f8e6c475-a0e5-4081-b265-61a7536a183e',  -- Die Kernpunkte der sozialen Frage #23
  '3b38df84-e9bc-4e70-9032-d3fa65517cfd'   -- Aufsätze über die Dreigliederung #24
);

-- Touch updated_at so the delta sync picks up the changes
UPDATE rag_sources SET updated_at = now();

-- =============================================================================
-- Redefine pull_changes with is_primary included in rag_sources SELECT
-- =============================================================================
CREATE OR REPLACE FUNCTION pull_changes(
  last_pulled_at  bigint  DEFAULT 0,
  schema_version  int     DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET statement_timeout TO 0
AS $$
DECLARE
  v_uid       uuid        := auth.uid();
  v_since     timestamptz := ms_to_ts(last_pulled_at);
  v_now_ms    bigint      := ts_to_ms(now());

  v_src_created  json;  v_src_updated  json;
  v_par_created  json;  v_par_updated  json;
  v_tlk_created  json;  v_tlk_updated  json;  v_tlk_deleted json;
  v_trn_created  json;  v_trn_updated  json;  v_trn_deleted json;
  v_ref_created  json;
  v_nte_created  json;  v_nte_updated  json;  v_nte_deleted json;
  v_bkm_created  json;  v_bkm_updated  json;  v_bkm_deleted json;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- -------------------------------------------------------------------------
  -- rag_sources  (read-only catalogue)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_src_created FROM (
    SELECT
      id::text AS id,
      title, author, language, year, book_index, is_primary,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_sources
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_src_updated FROM (
    SELECT
      id::text AS id,
      title, author, language, year, book_index, is_primary,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_sources
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- -------------------------------------------------------------------------
  -- rag_paragraphs  (read-only, no deletes surfaced)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_par_created FROM (
    SELECT
      id, source_id, language,
      segment_index, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_par_updated FROM (
    SELECT
      id, source_id, language,
      segment_index, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- -------------------------------------------------------------------------
  -- rag_talks  (own + publicly shared)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_tlk_created FROM (
    SELECT
      talk_id::text AS id,
      collection, user_id, user_name, title, personality,
      summary, usage::text AS usage, kontext_meta::text AS kontext_meta,
      publishing_status,
      kontext_source_id, kontext_paragraph_id, kontext_paragraph,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_talks
    WHERE created_at > v_since
      AND (user_id = v_uid::text OR publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_tlk_updated FROM (
    SELECT
      talk_id::text AS id,
      collection, user_id, user_name, title, personality,
      summary, usage::text AS usage, kontext_meta::text AS kontext_meta,
      publishing_status,
      kontext_source_id, kontext_paragraph_id, kontext_paragraph,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_talks
    WHERE updated_at > v_since AND created_at <= v_since
      AND (user_id = v_uid::text OR publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(talk_id::text) INTO v_tlk_deleted
  FROM rag_talks
  WHERE updated_at > v_since
    AND user_id <> v_uid::text
    AND publishing_status NOT IN ('peers', 'candidate', 'staged', 'published');

  -- -------------------------------------------------------------------------
  -- rag_turns
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_trn_created FROM (
    SELECT
      t.turn_id::text AS id, t.talk_id::text AS talk_id,
      t.turn_index, t.personality,
      t.user_message, t.assistant_message,
      t.usage::text AS usage, t.collection,
      t.chunk_index_map::text AS chunk_index_map,
      t.kontext_meta::text AS kontext_meta,
      ts_to_ms(t.created_at) AS created_at,
      ts_to_ms(t.updated_at) AS updated_at
    FROM rag_turns t
    JOIN rag_talks tk ON tk.talk_id = t.talk_id
    WHERE t.created_at > v_since
      AND (tk.user_id = v_uid::text OR tk.publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_trn_updated FROM (
    SELECT
      t.turn_id::text AS id, t.talk_id::text AS talk_id,
      t.turn_index, t.personality,
      t.user_message, t.assistant_message,
      t.usage::text AS usage, t.collection,
      t.chunk_index_map::text AS chunk_index_map,
      t.kontext_meta::text AS kontext_meta,
      ts_to_ms(t.created_at) AS created_at,
      ts_to_ms(t.updated_at) AS updated_at
    FROM rag_turns t
    JOIN rag_talks tk ON tk.talk_id = t.talk_id
    WHERE t.updated_at > v_since AND t.created_at <= v_since
      AND (tk.user_id = v_uid::text OR tk.publishing_status IN ('peers', 'candidate', 'staged', 'published'))
  ) r;

  SELECT json_agg(t.turn_id::text) INTO v_trn_deleted
  FROM rag_turns t
  JOIN rag_talks tk ON tk.talk_id = t.talk_id
  WHERE t.updated_at > v_since
    AND tk.user_id <> v_uid::text
    AND tk.publishing_status NOT IN ('peers', 'candidate', 'staged', 'published');

  -- -------------------------------------------------------------------------
  -- rag_references  (read-only, filtered to own talks' turns)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_ref_created FROM (
    SELECT
      r.ref_id::text AS id, r.turn_id::text AS turn_id,
      r.ref_index, r.chunk_id, r.relevance, r.source_title, r.segment_title,
      ts_to_ms(r.created_at) AS created_at,
      ts_to_ms(r.created_at) AS updated_at
    FROM rag_references r
    JOIN rag_turns t  ON t.turn_id  = r.turn_id
    JOIN rag_talks tk ON tk.talk_id = t.talk_id
    WHERE r.created_at > v_since AND tk.user_id = v_uid::text
  ) r;

  -- -------------------------------------------------------------------------
  -- app_notes  (own rows only)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_nte_created FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND created_at > v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_nte_updated FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND updated_at > v_since AND created_at <= v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_nte_deleted FROM app_notes
  WHERE user_id = v_uid AND deleted_at > v_since;

  -- -------------------------------------------------------------------------
  -- app_bookmarks  (own rows only)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_bkm_created FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, is_last_read, is_manual,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_bookmarks
    WHERE user_id = v_uid AND created_at > v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_bkm_updated FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, is_last_read, is_manual,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_bookmarks
    WHERE user_id = v_uid AND updated_at > v_since AND created_at <= v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_bkm_deleted FROM app_bookmarks
  WHERE user_id = v_uid AND deleted_at > v_since;

  -- -------------------------------------------------------------------------
  -- Assemble response
  -- -------------------------------------------------------------------------
  RETURN json_build_object(
    'timestamp', v_now_ms,
    'changes', json_build_object(
      'sources', json_build_object(
        'created', COALESCE(v_src_created, '[]'::json),
        'updated', COALESCE(v_src_updated, '[]'::json),
        'deleted', '[]'::json
      ),
      'paragraphs', json_build_object(
        'created', COALESCE(v_par_created, '[]'::json),
        'updated', COALESCE(v_par_updated, '[]'::json),
        'deleted', '[]'::json
      ),
      'talks', json_build_object(
        'created', COALESCE(v_tlk_created, '[]'::json),
        'updated', COALESCE(v_tlk_updated, '[]'::json),
        'deleted', COALESCE(v_tlk_deleted, '[]'::json)
      ),
      'turns', json_build_object(
        'created', COALESCE(v_trn_created, '[]'::json),
        'updated', COALESCE(v_trn_updated, '[]'::json),
        'deleted', COALESCE(v_trn_deleted, '[]'::json)
      ),
      'references', json_build_object(
        'created', COALESCE(v_ref_created, '[]'::json),
        'updated', '[]'::json,
        'deleted', '[]'::json
      ),
      'notes', json_build_object(
        'created', COALESCE(v_nte_created, '[]'::json),
        'updated', COALESCE(v_nte_updated, '[]'::json),
        'deleted', COALESCE(v_nte_deleted, '[]'::json)
      ),
      'bookmarks', json_build_object(
        'created', COALESCE(v_bkm_created, '[]'::json),
        'updated', COALESCE(v_bkm_updated, '[]'::json),
        'deleted', COALESCE(v_bkm_deleted, '[]'::json)
      )
    )
  );
END $$;

GRANT EXECUTE ON FUNCTION pull_changes(bigint, int) TO authenticated;
