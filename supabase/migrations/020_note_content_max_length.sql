-- 020: 1 MB content limit for create_note / save_note (MCP Schritt 0c.3 / F-4)
-- Next free App-Migration after 018 (019 is ragkeep lecture catalog).

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

  IF octet_length(COALESCE(p_content, '')) > 1048576 THEN
    RETURN jsonb_build_object(
      'error', 'content exceeds maximum length of 1048576 bytes (1 MB)',
      'code', 'content_too_long'
    );
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

  IF octet_length(COALESCE(p_content, '')) > 1048576 THEN
    RETURN jsonb_build_object(
      'error', 'content exceeds maximum length of 1048576 bytes (1 MB)',
      'code', 'content_too_long'
    );
  END IF;

  INSERT INTO app_notes (id, user_id, title, content, text_type, paragraph_id, conversation_url, status, version, created_by)
  VALUES (p_id, auth.uid(), p_title, p_content, p_text_type, p_paragraph_id, p_conversation_url, 'draft', 1, p_created_by);
  RETURN jsonb_build_object('ok', true, 'id', p_id, 'version', 1);
EXCEPTION WHEN unique_violation THEN
  RETURN jsonb_build_object('error', 'exists');
END;
$$;
