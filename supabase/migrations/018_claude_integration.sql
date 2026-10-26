-- Filo × Claude integration (Plan Schritt 8d)
-- Arbeitstexte-Versionierung, Protokolle, Handoffs, passage_redirect, connector_grants.
-- Kein user_profiles / claude_tier.

-- ---------------------------------------------------------------------------
-- Arbeitstexte erweitern
-- ---------------------------------------------------------------------------
ALTER TABLE app_notes
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS text_type varchar(32) DEFAULT 'note',
  ADD COLUMN IF NOT EXISTS status varchar(16) NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS conversation_url text,
  ADD COLUMN IF NOT EXISTS version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS quote_exact text,
  ADD COLUMN IF NOT EXISTS quote_prefix text,
  ADD COLUMN IF NOT EXISTS quote_suffix text,
  ADD COLUMN IF NOT EXISTS created_by varchar(16) NOT NULL DEFAULT 'user';

ALTER TABLE app_bookmarks
  ADD COLUMN IF NOT EXISTS quote_exact text,
  ADD COLUMN IF NOT EXISTS quote_prefix text,
  ADD COLUMN IF NOT EXISTS quote_suffix text;

-- Versionshistorie (Titel und Status mitversioniert)
CREATE TABLE IF NOT EXISTS app_note_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  note_id text NOT NULL REFERENCES app_notes(id) ON DELETE CASCADE,
  version integer NOT NULL,
  title text,
  content text NOT NULL,
  status varchar(16),
  changed_by varchar(16) NOT NULL DEFAULT 'user',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (note_id, version)
);

DO $$ BEGIN
  ALTER TABLE app_note_versions
    ADD CONSTRAINT chk_changed_by CHECK (changed_by IN ('user', 'claude'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE app_notes
    ADD CONSTRAINT chk_created_by CHECK (created_by IN ('user', 'claude'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- Transaktionale Note-Funktionen (einziger Schreibweg)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION save_note(
  p_id text,
  p_content text,
  p_expected_version integer,
  p_changed_by varchar DEFAULT 'user',
  p_title text DEFAULT NULL,
  p_status varchar DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note app_notes%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;

  SELECT * INTO v_note FROM app_notes
  WHERE id = p_id AND user_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;

  IF v_note.version <> p_expected_version THEN
    RETURN jsonb_build_object(
      'error', 'conflict',
      'current_version', v_note.version,
      'current_content', v_note.content,
      'current_title', v_note.title
    );
  END IF;

  INSERT INTO app_note_versions (note_id, version, title, content, status, changed_by)
  VALUES (p_id, v_note.version, v_note.title, v_note.content, v_note.status, p_changed_by);

  UPDATE app_notes SET
    content = p_content,
    title = COALESCE(p_title, title),
    status = COALESCE(p_status, status),
    version = version + 1,
    updated_at = now()
  WHERE id = p_id;

  RETURN jsonb_build_object('ok', true, 'new_version', v_note.version + 1);
END;
$$;

CREATE OR REPLACE FUNCTION create_note(
  p_id text,
  p_title text,
  p_content text,
  p_text_type varchar DEFAULT 'note',
  p_paragraph_id text DEFAULT NULL,
  p_conversation_url text DEFAULT NULL,
  p_created_by varchar DEFAULT 'user'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;

  INSERT INTO app_notes (id, user_id, title, content, text_type, paragraph_id, conversation_url, status, version, created_by)
  VALUES (p_id, auth.uid(), p_title, p_content, p_text_type, p_paragraph_id, p_conversation_url, 'draft', 1, p_created_by);
  RETURN jsonb_build_object('ok', true, 'id', p_id, 'version', 1);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'exists');
END;
$$;

CREATE OR REPLACE FUNCTION delete_note(p_id text) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;
  UPDATE app_notes SET deleted_at = now(), updated_at = now()
  WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

CREATE OR REPLACE FUNCTION undelete_note(p_id text) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;
  UPDATE app_notes SET deleted_at = NULL, updated_at = now()
  WHERE id = p_id AND user_id = auth.uid() AND deleted_at IS NOT NULL;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'not_found');
  END IF;
  RETURN jsonb_build_object('ok', true);
END;
$$;

REVOKE EXECUTE ON FUNCTION save_note(text, text, integer, varchar, text, varchar) FROM anon, public;
REVOKE EXECUTE ON FUNCTION create_note(text, text, text, varchar, text, text, varchar) FROM anon, public;
REVOKE EXECUTE ON FUNCTION delete_note(text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION undelete_note(text) FROM anon, public;
GRANT EXECUTE ON FUNCTION save_note(text, text, integer, varchar, text, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION create_note(text, text, text, varchar, text, text, varchar) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_note(text) TO authenticated;
GRANT EXECUTE ON FUNCTION undelete_note(text) TO authenticated;

-- ---------------------------------------------------------------------------
-- Protokolle
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS protocols (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id text NOT NULL,
  segment_slug text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, source_id, segment_slug)
);

CREATE TABLE IF NOT EXISTS protocol_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id uuid NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  paragraph_id uuid,
  entry_type varchar(32) NOT NULL,
  content text NOT NULL,
  conversation_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_protocol_entries_paragraph ON protocol_entries (paragraph_id);
CREATE INDEX IF NOT EXISTS idx_protocols_user ON protocols (user_id);

DROP TRIGGER IF EXISTS trg_protocols_updated ON protocols;
CREATE TRIGGER trg_protocols_updated
  BEFORE UPDATE ON protocols
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ---------------------------------------------------------------------------
-- Handoffs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS handoffs (
  id varchar(12) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paragraph_id text,
  source_id text,
  segment_slug text,
  marked_text text,
  user_question text,
  return_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_handoffs_user ON handoffs (user_id);

CREATE OR REPLACE FUNCTION create_handoff(
  p_paragraph_id text,
  p_source_id text,
  p_segment_slug text,
  p_marked_text text,
  p_user_question text,
  p_return_url text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id text;
  v_chars text := 'abcdefghijkmnpqrstuvwxyz23456789';
  i int;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('error', 'unauthenticated');
  END IF;
  LOOP
    v_id := '';
    FOR i IN 1..5 LOOP
      v_id := v_id || substr(v_chars, 1 + floor(random() * length(v_chars))::int, 1);
    END LOOP;
    BEGIN
      INSERT INTO handoffs (id, user_id, paragraph_id, source_id, segment_slug, marked_text, user_question, return_url)
      VALUES (v_id, auth.uid(), p_paragraph_id, p_source_id, p_segment_slug, p_marked_text, p_user_question, p_return_url);
      RETURN jsonb_build_object('ok', true, 'id', v_id);
    EXCEPTION WHEN unique_violation THEN
      NULL;
    END;
  END LOOP;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_handoff(text, text, text, text, text, text) FROM anon, public;
GRANT EXECUTE ON FUNCTION create_handoff(text, text, text, text, text, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- passage_redirect (1.0 leer / Pass-through)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS passage_redirect (
  old_id text PRIMARY KEY,
  new_id text NOT NULL,
  corpus_version integer NOT NULL,
  kind varchar(16) NOT NULL,
  old_text text
);

DO $$ BEGIN
  ALTER TABLE passage_redirect
    ADD CONSTRAINT chk_passage_redirect_kind CHECK (kind IN ('merged', 'deleted'));
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ---------------------------------------------------------------------------
-- connector_grants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS connector_grants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id text NOT NULL,
  client_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_refresh timestamptz,
  last_mcp_request timestamptz,
  revoked_at timestamptz,
  UNIQUE (user_id, client_id)
);

CREATE INDEX IF NOT EXISTS idx_connector_grants_user ON connector_grants (user_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

-- app_notes: SELECT bleibt; Schreiben nur über create_note/save_note/delete_note/undelete_note
DROP POLICY IF EXISTS notes_insert ON app_notes;
DROP POLICY IF EXISTS notes_update ON app_notes;
DROP POLICY IF EXISTS notes_delete ON app_notes;
-- notes_select already exists (own rows, including soft-deleted)

ALTER TABLE app_note_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS note_versions_select ON app_note_versions;
CREATE POLICY note_versions_select ON app_note_versions
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM app_notes n
      WHERE n.id = note_id AND n.user_id = auth.uid()
    )
  );

ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS protocols_select ON protocols;
DROP POLICY IF EXISTS protocols_insert ON protocols;
CREATE POLICY protocols_select ON protocols
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
CREATE POLICY protocols_insert ON protocols
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

ALTER TABLE protocol_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS protocol_entries_select ON protocol_entries;
DROP POLICY IF EXISTS protocol_entries_insert ON protocol_entries;
CREATE POLICY protocol_entries_select ON protocol_entries
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM protocols p
      WHERE p.id = protocol_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY protocol_entries_insert ON protocol_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM protocols p
      WHERE p.id = protocol_id AND p.user_id = auth.uid()
    )
  );

ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS handoffs_select ON handoffs;
CREATE POLICY handoffs_select ON handoffs
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE connector_grants ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS connector_grants_select ON connector_grants;
CREATE POLICY connector_grants_select ON connector_grants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

ALTER TABLE passage_redirect ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS passage_redirect_select ON passage_redirect;
CREATE POLICY passage_redirect_select ON passage_redirect
  FOR SELECT TO authenticated
  USING (true);
