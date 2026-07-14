-- =============================================================================
-- Notes context: segment_slug + paragraph_id (UUID) alignment
-- Wipe app_notes for fresh start (user request).
-- =============================================================================

ALTER TABLE app_notes ADD COLUMN IF NOT EXISTS segment_slug text;

CREATE INDEX IF NOT EXISTS idx_app_notes_segment_slug ON app_notes (segment_slug);

-- Fresh start: remove all notes (including soft-deleted rows).
DELETE FROM app_notes;

-- =============================================================================
-- pull_changes — include segment_slug on paragraphs and notes
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

  -- rag_sources
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

  -- rag_paragraphs
  SELECT json_agg(row_to_json(r)) INTO v_par_created FROM (
    SELECT
      id::text AS id, source_id, language,
      segment_index, segment_slug, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_par_updated FROM (
    SELECT
      id::text AS id, source_id, language,
      segment_index, segment_slug, segment_title, paragraph_number,
      text_raw, annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at)    AS created_at,
      ts_to_ms(updated_at)    AS updated_at
    FROM rag_paragraphs
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- rag_talks
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

  -- rag_turns
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

  -- rag_references
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

  -- app_notes
  SELECT json_agg(row_to_json(r)) INTO v_nte_created FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, segment_slug,
      content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND created_at > v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_nte_updated FROM (
    SELECT id, user_id::text AS user_id, paragraph_id, source_id, segment_slug,
      content, is_public,
      ts_to_ms(created_at) AS created_at, ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid AND updated_at > v_since AND created_at <= v_since AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_nte_deleted FROM app_notes
  WHERE user_id = v_uid AND deleted_at > v_since;

  -- app_bookmarks
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

-- =============================================================================
-- push_changes — persist segment_slug on notes
-- =============================================================================
CREATE OR REPLACE FUNCTION push_changes(
  changes        jsonb,
  last_pulled_at bigint DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid   uuid := auth.uid();
  rec     jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- app_notes — created
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'notes'->'created', '[]'::jsonb)
  ) LOOP
    INSERT INTO app_notes (
      id, user_id, paragraph_id, source_id, segment_slug,
      content, is_public, created_at, updated_at
    ) VALUES (
      rec->>'id', v_uid,
      NULLIF(rec->>'paragraph_id', ''),
      NULLIF(rec->>'source_id', ''),
      NULLIF(rec->>'segment_slug', ''),
      COALESCE(rec->>'content', ''),
      COALESCE((rec->>'is_public')::boolean, false),
      ms_to_ts(COALESCE((rec->>'created_at')::bigint, 0)),
      ms_to_ts(COALESCE((rec->>'updated_at')::bigint, 0))
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- app_notes — updated
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'notes'->'updated', '[]'::jsonb)
  ) LOOP
    UPDATE app_notes SET
      paragraph_id = NULLIF(rec->>'paragraph_id', ''),
      source_id    = NULLIF(rec->>'source_id', ''),
      segment_slug = NULLIF(rec->>'segment_slug', ''),
      content      = COALESCE(rec->>'content', ''),
      is_public    = COALESCE((rec->>'is_public')::boolean, false),
      updated_at   = ms_to_ts(COALESCE((rec->>'updated_at')::bigint, 0))
    WHERE id = rec->>'id' AND user_id = v_uid;
  END LOOP;

  -- app_notes — deleted (soft-delete)
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'notes'->'deleted', '[]'::jsonb)
  ) LOOP
    UPDATE app_notes SET deleted_at = now()
    WHERE id = rec #>> '{}' AND user_id = v_uid AND deleted_at IS NULL;
  END LOOP;

  -- app_bookmarks — created
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'bookmarks'->'created', '[]'::jsonb)
  ) LOOP
    INSERT INTO app_bookmarks (
      id, user_id, paragraph_id, source_id,
      is_last_read, is_manual, created_at, updated_at
    ) VALUES (
      rec->>'id',
      v_uid,
      rec->>'paragraph_id',
      rec->>'source_id',
      COALESCE((rec->>'is_last_read')::boolean, false),
      COALESCE((rec->>'is_manual')::boolean, false),
      ms_to_ts(COALESCE((rec->>'created_at')::bigint, 0)),
      ms_to_ts(COALESCE((rec->>'updated_at')::bigint, 0))
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;

  -- app_bookmarks — updated
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'bookmarks'->'updated', '[]'::jsonb)
  ) LOOP
    UPDATE app_bookmarks SET
      paragraph_id = rec->>'paragraph_id',
      source_id    = rec->>'source_id',
      is_last_read = COALESCE((rec->>'is_last_read')::boolean, false),
      is_manual    = COALESCE((rec->>'is_manual')::boolean, false),
      updated_at   = ms_to_ts(COALESCE((rec->>'updated_at')::bigint, 0))
    WHERE id = rec->>'id' AND user_id = v_uid;
  END LOOP;

  -- app_bookmarks — deleted (soft-delete)
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'bookmarks'->'deleted', '[]'::jsonb)
  ) LOOP
    UPDATE app_bookmarks SET deleted_at = now()
    WHERE id = rec #>> '{}' AND user_id = v_uid AND deleted_at IS NULL;
  END LOOP;

END $$;

GRANT EXECUTE ON FUNCTION push_changes(jsonb, bigint) TO authenticated;
