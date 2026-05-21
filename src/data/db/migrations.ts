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
        // talks: mensch_id replaces user_id; new ragrun columns
        addColumns({
          table: 'talks',
          columns: [
            { name: 'mensch_id',          type: 'string', isIndexed: true },
            { name: 'mensch_name',        type: 'string', isOptional: true },
            { name: 'slug',               type: 'string', isOptional: true },
            { name: 'action_id',          type: 'string', isOptional: true },
            { name: 'usage',              type: 'string', isOptional: true },
            { name: 'kontext_meta',       type: 'string', isOptional: true },
            { name: 'bug_description',    type: 'string', isOptional: true },
            { name: 'kontext_source_id',  type: 'string', isOptional: true, isIndexed: true },
            { name: 'kontext_segment_id', type: 'string', isOptional: true },
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
  ],
});
