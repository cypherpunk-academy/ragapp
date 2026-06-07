import { addColumns, createTable, schemaMigrations, unsafeExecuteSql } from '@nozbe/watermelondb/Schema/migrations';


export const migrations = schemaMigrations({
  migrations: [
    {
      toVersion: 2,
      steps: [
        addColumns({
          table: 'talks',
          columns: [
            { name: 'context_paragraph_id', type: 'string', isOptional: true, isIndexed: true },
          ],
        }),
        createTable({
          name: 'references',
          columns: [
            { name: 'ref_id', type: 'string', isIndexed: true },
            { name: 'paragraph_id', type: 'string', isIndexed: true },
            { name: 'turn_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'chunk_id', type: 'string', isOptional: true, isIndexed: true },
            { name: 'ref_index', type: 'number' },
            { name: 'ref_kind', type: 'string', isOptional: true },
            { name: 'relevance', type: 'number', isOptional: true },
            { name: 'source_title', type: 'string', isOptional: true },
            { name: 'segment_title', type: 'string', isOptional: true },
            { name: 'snippet', type: 'string', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 3,
      steps: [
        unsafeExecuteSql('DELETE FROM bookmarks WHERE is_last_read = 0;'),
      ],
    },
    {
      toVersion: 4,
      steps: [
        addColumns({
          table: 'bookmarks',
          columns: [
            { name: 'is_manual', type: 'boolean', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 5,
      steps: [
        // chunks: rag_partition replaces collection; new ragrun columns
        addColumns({
          table: 'chunks',
          columns: [
            { name: 'rag_partition', type: 'string', isIndexed: true },
            { name: 'language',      type: 'string', isOptional: true },
            { name: 'importance',    type: 'number', isOptional: true },
            { name: 'content_hash',  type: 'string', isOptional: true },
            { name: 'metadata',      type: 'string', isOptional: true },
            { name: 'scope',         type: 'string', isOptional: true },
            { name: 'embedded_at',   type: 'number', isOptional: true },
          ],
        }),
        // talks: user_id (= Supabase auth.uid(), stored as mensch_id in ragrun) + new columns
        addColumns({
          table: 'talks',
          columns: [
            { name: 'user_id',    type: 'string', isIndexed: true },
            { name: 'user_name',  type: 'string', isOptional: true },
            { name: 'personality',        type: 'string', isOptional: true },
            { name: 'usage',              type: 'string', isOptional: true },
            { name: 'kontext_meta',       type: 'string', isOptional: true },
            { name: 'kontext_source_id',  type: 'string', isOptional: true, isIndexed: true },
            { name: 'kontext_paragraph_id', type: 'string', isOptional: true },
            { name: 'kontext_paragraph',  type: 'string', isOptional: true },
          ],
        }),
        // turns: new ragrun columns
        addColumns({
          table: 'turns',
          columns: [
            { name: 'action_id',    type: 'string', isOptional: true },
            { name: 'usage',        type: 'string', isOptional: true },
            { name: 'collection',   type: 'string', isOptional: true },
            { name: 'is_relay',     type: 'boolean' },
            { name: 'kontext_meta', type: 'string', isOptional: true },
          ],
        }),
      ],
    },
    {
      toVersion: 6,
      steps: [
        // turns: action_id → personality; remove assistant_personality, is_relay
        // Note: talks never had action_id — personality was already added in v5
        unsafeExecuteSql('ALTER TABLE turns RENAME COLUMN action_id TO personality;'),
        unsafeExecuteSql('ALTER TABLE turns DROP COLUMN assistant_personality;'),
        unsafeExecuteSql('ALTER TABLE turns DROP COLUMN is_relay;'),
      ],
    },
    {
      toVersion: 7,
      steps: [
        // chunks table removed — fetched on demand via ragrun API
        unsafeExecuteSql('DROP TABLE IF EXISTS chunks;'),
      ],
    },
    {
      toVersion: 8,
      steps: [
        createTable({
          name: 'sources',
          columns: [
            { name: 'title',      type: 'string' },
            { name: 'author',     type: 'string' },
            { name: 'language',   type: 'string', isOptional: true },
            { name: 'year',       type: 'number', isOptional: true },
            { name: 'book_index', type: 'number', isOptional: true },
            { name: 'created_at', type: 'number' },
            { name: 'updated_at', type: 'number' },
          ],
        }),
      ],
    },
    {
      toVersion: 9,
      steps: [
        addColumns({
          table: 'sources',
          columns: [
            { name: 'is_primary', type: 'boolean' },
          ],
        }),
      ],
    },
    {
      toVersion: 10,
      steps: [
        addColumns({
          table: 'sources',
          columns: [
            { name: 'sort_order', type: 'number', isOptional: true },
          ],
        }),
      ],
    },
  ],
});
