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
  ],
});
