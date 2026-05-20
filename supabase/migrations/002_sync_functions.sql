-- =============================================================================
-- WatermelonDB sync RPC functions
-- Protocol: https://watermelondb.dev/docs/Sync/Backend
--
-- pull_changes(last_pulled_at bigint, schema_version int)
--   → { changes: SyncDatabaseChangeSet, timestamp: bigint }
--
-- push_changes(changes jsonb, last_pulled_at bigint)
--   → void
--
-- Timestamps are Unix milliseconds (WatermelonDB convention).
-- =============================================================================

-- ---------------------------------------------------------------------------
-- pull_changes
-- Returns all rows modified after last_pulled_at for the authenticated user.
-- Read-only tables (rag_*): pulled but never pushed.
-- User tables (app_*):      pulled and pushed bidirectionally.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION pull_changes(
  last_pulled_at  bigint  DEFAULT 0,
  schema_version  int     DEFAULT 1
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid       uuid        := auth.uid();
  v_since     timestamptz := ms_to_ts(last_pulled_at);
  v_now_ms    bigint      := ts_to_ms(now());

  -- paragraphs
  v_par_created  json;
  v_par_updated  json;
  v_par_deleted  json;

  -- chunks
  v_chk_created  json;
  v_chk_updated  json;

  -- talks
  v_tlk_created  json;
  v_tlk_updated  json;
  v_tlk_deleted  json;

  -- turns
  v_trn_created  json;
  v_trn_updated  json;
  v_trn_deleted  json;

  -- references
  v_ref_created  json;
  v_ref_updated  json;

  -- notes
  v_nte_created  json;
  v_nte_updated  json;
  v_nte_deleted  json;

  -- bookmarks
  v_bkm_created  json;
  v_bkm_updated  json;
  v_bkm_deleted  json;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- -------------------------------------------------------------------------
  -- rag_paragraphs  (read-only, no deletes surfaced to app)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_par_created FROM (
    SELECT
      id,  source_id,  book_id,  language,
      segment_type,  segment_index,  segment_title,  paragraph_number,
      text_raw,  annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_paragraphs
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_par_updated FROM (
    SELECT
      id,  source_id,  book_id,  language,
      segment_type,  segment_index,  segment_title,  paragraph_number,
      text_raw,  annotations::text AS annotations,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_paragraphs
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  v_par_deleted := '[]'::json;

  -- -------------------------------------------------------------------------
  -- rag_chunks  (read-only)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_chk_created FROM (
    SELECT
      id,  collection,  source_id,  segment_id,  chunk_type,  text,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_chunks
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_chk_updated FROM (
    SELECT
      id,  collection,  source_id,  segment_id,  chunk_type,  text,
      ts_to_ms(deprecated_at) AS deprecated_at,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_chunks
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- -------------------------------------------------------------------------
  -- rag_talks  (readable: own + non-private)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_tlk_created FROM (
    SELECT
      id,  user_id::text,  collection,  title,  summary,
      context_mode,  context_ids::text AS context_ids,  context_paragraph_id,
      publishing_status,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_talks
    WHERE created_at > v_since
      AND (user_id = v_uid OR publishing_status <> 'private')
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_tlk_updated FROM (
    SELECT
      id,  user_id::text,  collection,  title,  summary,
      context_mode,  context_ids::text AS context_ids,  context_paragraph_id,
      publishing_status,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_talks
    WHERE updated_at > v_since AND created_at <= v_since
      AND (user_id = v_uid OR publishing_status <> 'private')
  ) r;

  -- Talks that became private after last sync = soft-deleted from app perspective
  SELECT json_agg(id) INTO v_tlk_deleted FROM rag_talks
  WHERE updated_at > v_since
    AND publishing_status = 'private'
    AND user_id <> v_uid;

  -- -------------------------------------------------------------------------
  -- rag_turns
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_trn_created FROM (
    SELECT
      t.id,  t.talk_id,  t.turn_index,  t.assistant_personality,
      t.user_message,  t.assistant_message,
      t.chunk_index_map::text AS chunk_index_map,
      ts_to_ms(t.created_at) AS created_at,
      ts_to_ms(t.updated_at) AS updated_at
    FROM rag_turns t
    JOIN rag_talks tk ON tk.id = t.talk_id
    WHERE t.created_at > v_since
      AND (tk.user_id = v_uid OR tk.publishing_status <> 'private')
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_trn_updated FROM (
    SELECT
      t.id,  t.talk_id,  t.turn_index,  t.assistant_personality,
      t.user_message,  t.assistant_message,
      t.chunk_index_map::text AS chunk_index_map,
      ts_to_ms(t.created_at) AS created_at,
      ts_to_ms(t.updated_at) AS updated_at
    FROM rag_turns t
    JOIN rag_talks tk ON tk.id = t.talk_id
    WHERE t.updated_at > v_since AND t.created_at <= v_since
      AND (tk.user_id = v_uid OR tk.publishing_status <> 'private')
  ) r;

  SELECT json_agg(t.id) INTO v_trn_deleted
  FROM rag_turns t
  JOIN rag_talks tk ON tk.id = t.talk_id
  WHERE t.updated_at > v_since
    AND tk.publishing_status = 'private'
    AND tk.user_id <> v_uid;

  -- -------------------------------------------------------------------------
  -- rag_references  (read-only)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_ref_created FROM (
    SELECT
      id,  paragraph_id,  turn_id,  chunk_id,
      ref_index,  ref_kind,  relevance,  source_title,  segment_title,  snippet,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_references
    WHERE created_at > v_since
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_ref_updated FROM (
    SELECT
      id,  paragraph_id,  turn_id,  chunk_id,
      ref_index,  ref_kind,  relevance,  source_title,  segment_title,  snippet,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM rag_references
    WHERE updated_at > v_since AND created_at <= v_since
  ) r;

  -- -------------------------------------------------------------------------
  -- app_notes  (own rows only)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_nte_created FROM (
    SELECT
      id,  user_id::text,  paragraph_id,  segment_id,  source_id,
      content,  is_public,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid
      AND created_at > v_since
      AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_nte_updated FROM (
    SELECT
      id,  user_id::text,  paragraph_id,  segment_id,  source_id,
      content,  is_public,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM app_notes
    WHERE user_id = v_uid
      AND updated_at > v_since AND created_at <= v_since
      AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_nte_deleted FROM app_notes
  WHERE user_id = v_uid
    AND deleted_at > v_since;

  -- -------------------------------------------------------------------------
  -- app_bookmarks  (own rows only)
  -- -------------------------------------------------------------------------
  SELECT json_agg(row_to_json(r)) INTO v_bkm_created FROM (
    SELECT
      id,  user_id::text,  paragraph_id,  source_id,
      is_last_read,  is_manual,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM app_bookmarks
    WHERE user_id = v_uid
      AND created_at > v_since
      AND deleted_at IS NULL
  ) r;

  SELECT json_agg(row_to_json(r)) INTO v_bkm_updated FROM (
    SELECT
      id,  user_id::text,  paragraph_id,  source_id,
      is_last_read,  is_manual,
      ts_to_ms(created_at) AS created_at,
      ts_to_ms(updated_at) AS updated_at
    FROM app_bookmarks
    WHERE user_id = v_uid
      AND updated_at > v_since AND created_at <= v_since
      AND deleted_at IS NULL
  ) r;

  SELECT json_agg(id) INTO v_bkm_deleted FROM app_bookmarks
  WHERE user_id = v_uid
    AND deleted_at > v_since;

  -- -------------------------------------------------------------------------
  -- Assemble response
  -- -------------------------------------------------------------------------
  RETURN json_build_object(
    'timestamp', v_now_ms,
    'changes', json_build_object(
      'paragraphs', json_build_object(
        'created', COALESCE(v_par_created, '[]'::json),
        'updated', COALESCE(v_par_updated, '[]'::json),
        'deleted', COALESCE(v_par_deleted, '[]'::json)
      ),
      'chunks', json_build_object(
        'created', COALESCE(v_chk_created, '[]'::json),
        'updated', COALESCE(v_chk_updated, '[]'::json),
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
        'updated', COALESCE(v_ref_updated, '[]'::json),
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

-- Allow authenticated users to call pull_changes
GRANT EXECUTE ON FUNCTION pull_changes(bigint, int) TO authenticated;

-- ---------------------------------------------------------------------------
-- push_changes
-- Upserts app_notes and app_bookmarks from the client.
-- rag_* tables are intentionally excluded — the backend owns them.
-- ---------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- app_notes — created
  -- -------------------------------------------------------------------------
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'notes'->'created', '[]'::jsonb)
  ) LOOP
    INSERT INTO app_notes (
      id, user_id, paragraph_id, segment_id, source_id,
      content, is_public, created_at, updated_at
    ) VALUES (
      rec->>'id',
      v_uid,
      NULLIF(rec->>'paragraph_id', ''),
      NULLIF(rec->>'segment_id', ''),
      NULLIF(rec->>'source_id', ''),
      COALESCE(rec->>'content', ''),
      COALESCE((rec->>'is_public')::boolean, false),
      ms_to_ts(COALESCE((rec->>'created_at')::bigint, 0)),
      ms_to_ts(COALESCE((rec->>'updated_at')::bigint, 0))
    )
    ON CONFLICT (id) DO NOTHING;  -- created on server already wins
  END LOOP;

  -- -------------------------------------------------------------------------
  -- app_notes — updated
  -- -------------------------------------------------------------------------
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'notes'->'updated', '[]'::jsonb)
  ) LOOP
    UPDATE app_notes SET
      paragraph_id  = NULLIF(rec->>'paragraph_id', ''),
      segment_id    = NULLIF(rec->>'segment_id', ''),
      source_id     = NULLIF(rec->>'source_id', ''),
      content       = COALESCE(rec->>'content', ''),
      is_public     = COALESCE((rec->>'is_public')::boolean, false),
      updated_at    = ms_to_ts(COALESCE((rec->>'updated_at')::bigint, 0))
    WHERE id = rec->>'id' AND user_id = v_uid;
  END LOOP;

  -- -------------------------------------------------------------------------
  -- app_notes — deleted  (soft-delete)
  -- -------------------------------------------------------------------------
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'notes'->'deleted', '[]'::jsonb)
  ) LOOP
    UPDATE app_notes SET deleted_at = now()
    WHERE id = rec::text::text AND user_id = v_uid AND deleted_at IS NULL;
  END LOOP;

  -- -------------------------------------------------------------------------
  -- app_bookmarks — created
  -- -------------------------------------------------------------------------
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

  -- -------------------------------------------------------------------------
  -- app_bookmarks — updated
  -- -------------------------------------------------------------------------
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'bookmarks'->'updated', '[]'::jsonb)
  ) LOOP
    UPDATE app_bookmarks SET
      paragraph_id  = rec->>'paragraph_id',
      source_id     = rec->>'source_id',
      is_last_read  = COALESCE((rec->>'is_last_read')::boolean, false),
      is_manual     = COALESCE((rec->>'is_manual')::boolean, false),
      updated_at    = ms_to_ts(COALESCE((rec->>'updated_at')::bigint, 0))
    WHERE id = rec->>'id' AND user_id = v_uid;
  END LOOP;

  -- -------------------------------------------------------------------------
  -- app_bookmarks — deleted  (soft-delete)
  -- -------------------------------------------------------------------------
  FOR rec IN SELECT * FROM jsonb_array_elements(
    COALESCE(changes->'bookmarks'->'deleted', '[]'::jsonb)
  ) LOOP
    UPDATE app_bookmarks SET deleted_at = now()
    WHERE id = rec::text AND user_id = v_uid AND deleted_at IS NULL;
  END LOOP;

END $$;

-- Allow authenticated users to call push_changes
GRANT EXECUTE ON FUNCTION push_changes(jsonb, bigint) TO authenticated;
