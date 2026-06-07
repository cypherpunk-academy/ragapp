-- =============================================================================
-- Add sort_order to rag_sources.
-- Reflects the order defined in the assistant manifest (primary-books first,
-- then secondary-books). Sources not in the manifest get sort_order = 9999.
-- =============================================================================

ALTER TABLE rag_sources ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 9999;

-- Primary books (philo-von-freisinn manifest order)
UPDATE rag_sources SET sort_order = 0   WHERE id = '4b8e4c2a-3f1b-4d2e-9c4a-8e4f4b2c3a1d'; -- Die Philosophie der Freiheit #4
UPDATE rag_sources SET sort_order = 1   WHERE id = 'd64fa532-6040-4fc2-9c43-ed4e5368bb92'; -- Die Rätsel der Philosophie #18
UPDATE rag_sources SET sort_order = 2   WHERE id = 'e58f6369-f7a7-4213-845f-c5b9bf82ffe5'; -- Wahrheit und Wissenschaft #3
UPDATE rag_sources SET sort_order = 3   WHERE id = '44217040-65bf-4150-9fa8-bac9c57cd1b1'; -- Grundlinien einer Erkenntnistheorie #2
UPDATE rag_sources SET sort_order = 4   WHERE id = '5e6303e1-a4a4-4be4-bafd-c4c575024b8e'; -- Friedrich Nietzsche. Ein Kämpfer #5
UPDATE rag_sources SET sort_order = 5   WHERE id = '64e881df-0501-4815-9b0c-6cf545c383b6'; -- Goethes Weltanschauung #6
UPDATE rag_sources SET sort_order = 6   WHERE id = 'f8e6c475-a0e5-4081-b265-61a7536a183e'; -- Die Kernpunkte der sozialen Frage #23
UPDATE rag_sources SET sort_order = 7   WHERE id = '3b38df84-e9bc-4e70-9032-d3fa65517cfd'; -- Aufsätze über die Dreigliederung #24

-- Secondary books
UPDATE rag_sources SET sort_order = 100 WHERE id = 'c2a4e407-cdf7-4802-be84-010cc485ef00'; -- Methodische Grundlagen #30
UPDATE rag_sources SET sort_order = 101 WHERE id = 'f287d43a-5108-4e0c-baa8-5e7d3badfef7'; -- Gesammelte Aufsätze #31
UPDATE rag_sources SET sort_order = 102 WHERE id = '47b137d3-f414-406f-b142-ed72c7e8989c'; -- Einleitungen zu Goethes Naturwissenschaftlichen Schriften #1
UPDATE rag_sources SET sort_order = 103 WHERE id = 'f78a79d5-8e8f-435e-bb58-ef6577312f57'; -- Lucifer-Gnosis #34
UPDATE rag_sources SET sort_order = 104 WHERE id = '7da60fa4-9281-4643-80e8-612f511e755d'; -- A Brief History of Hackerdom
UPDATE rag_sources SET sort_order = 105 WHERE id = '837193ab-505b-43b6-9ab7-bec8c3ed95dc'; -- How to Become a Hacker
UPDATE rag_sources SET sort_order = 106 WHERE id = 'a1fa8d65-911c-4adc-b11f-2c8a4e3866c7'; -- The Cathedral and the Bazaar
UPDATE rag_sources SET sort_order = 107 WHERE id = '123ef8cb-a442-4bbc-9570-e8681dd67f9f'; -- Rebel Code
UPDATE rag_sources SET sort_order = 108 WHERE id = '0c20163d-b14e-4750-988b-3b58c0fa3126'; -- Code Version 2.0
UPDATE rag_sources SET sort_order = 109 WHERE id = '4c09f3d5-3f5c-42b7-beba-f12fc46594bc'; -- Free Software, Free Society
UPDATE rag_sources SET sort_order = 110 WHERE id = 'f3b36ec2-031d-4715-ad66-dfc7f43cc491'; -- Cypherpunks
UPDATE rag_sources SET sort_order = 111 WHERE id = '36371313-0400-4c90-9656-67d54052cf89'; -- Julian Assange in his own words
UPDATE rag_sources SET sort_order = 112 WHERE id = '7758c53c-72bd-41f1-ae51-843eb2a0f718'; -- Various Interviews and Articles
UPDATE rag_sources SET sort_order = 113 WHERE id = '908fc041-096e-4440-8593-b3267b712bf5'; -- Die Wahrheit als Gesamtumfang

-- Touch updated_at so delta sync picks up the changes
UPDATE rag_sources SET updated_at = now();

-- =============================================================================
-- Update pull_changes to include sort_order
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
      title, author, language, year, book_index, is_primary, sort_order,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_sources
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_src_updated FROM (
    SELECT
      id::text AS id,
      title, author, language, year, book_index, is_primary, sort_order,
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
