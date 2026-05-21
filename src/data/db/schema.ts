import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 5,
  tables: [
    tableSchema({
      name: 'paragraphs',
      columns: [
        { name: 'paragraph_id',     type: 'string', isIndexed: true },
        { name: 'source_id',        type: 'string', isIndexed: true },
        { name: 'book_id',          type: 'string', isOptional: true },
        { name: 'language',         type: 'string', isOptional: true },
        { name: 'segment_type',     type: 'string' },
        { name: 'segment_index',    type: 'number' },
        { name: 'segment_title',    type: 'string' },
        { name: 'paragraph_number', type: 'number', isIndexed: true },
        { name: 'text_raw',         type: 'string' },
        { name: 'annotations',      type: 'string', isOptional: true }, // JSON
        { name: 'deprecated_at',    type: 'number', isOptional: true },
        { name: 'created_at',       type: 'number' },
        { name: 'updated_at',       type: 'number' },
      ],
    }),
    tableSchema({
      name: 'chunks',
      columns: [
        { name: 'rag_partition',  type: 'string', isIndexed: true },
        { name: 'chunk_id',       type: 'string', isIndexed: true },
        { name: 'source_id',      type: 'string', isIndexed: true },
        { name: 'chunk_type',     type: 'string', isOptional: true },
        { name: 'language',       type: 'string', isOptional: true },
        { name: 'importance',     type: 'number', isOptional: true },
        { name: 'content_hash',   type: 'string', isOptional: true },
        { name: 'text',           type: 'string', isOptional: true },
        { name: 'metadata',       type: 'string', isOptional: true }, // JSON
        { name: 'scope',          type: 'string', isOptional: true },
        { name: 'embedded_at',    type: 'number', isOptional: true },
        { name: 'deprecated_at',  type: 'number', isOptional: true },
        { name: 'created_at',     type: 'number' },
        { name: 'updated_at',     type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notes',
      columns: [
        { name: 'user_id',      type: 'string', isIndexed: true },
        { name: 'paragraph_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'source_id',    type: 'string', isOptional: true },
        { name: 'content',      type: 'string' },
        { name: 'is_public',    type: 'boolean' },
        { name: 'created_at',   type: 'number' },
        { name: 'updated_at',   type: 'number' },
      ],
    }),
    tableSchema({
      name: 'bookmarks',
      columns: [
        { name: 'user_id',      type: 'string', isIndexed: true },
        { name: 'paragraph_id', type: 'string', isIndexed: true },
        { name: 'source_id',    type: 'string', isIndexed: true },
        { name: 'is_last_read', type: 'boolean' },
        { name: 'is_manual',    type: 'boolean', isOptional: true },
        { name: 'created_at',   type: 'number' },
        { name: 'updated_at',   type: 'number' },
      ],
    }),
    tableSchema({
      name: 'talks',
      columns: [
        { name: 'user_id',    type: 'string', isIndexed: true },
        { name: 'user_name',  type: 'string', isOptional: true },
        { name: 'collection',         type: 'string', isOptional: true },
        { name: 'slug',               type: 'string', isOptional: true },
        { name: 'title',              type: 'string', isOptional: true },
        { name: 'action_id',          type: 'string', isOptional: true },
        { name: 'summary',            type: 'string', isOptional: true },
        { name: 'usage',              type: 'string', isOptional: true }, // JSON
        { name: 'kontext_meta',       type: 'string', isOptional: true }, // JSON
        { name: 'publishing_status',  type: 'string' },
        { name: 'bug_description',    type: 'string', isOptional: true },
        { name: 'kontext_source_id',  type: 'string', isOptional: true, isIndexed: true },
        { name: 'kontext_segment_id', type: 'string', isOptional: true },
        { name: 'kontext_paragraph',  type: 'string', isOptional: true },
        { name: 'created_at',         type: 'number' },
        { name: 'updated_at',         type: 'number' },
      ],
    }),
    tableSchema({
      name: 'turns',
      columns: [
        { name: 'talk_id',              type: 'string', isIndexed: true },
        { name: 'turn_index',           type: 'number', isOptional: true },
        { name: 'action_id',            type: 'string', isOptional: true },
        { name: 'assistant_personality',type: 'string', isOptional: true },
        { name: 'user_message',         type: 'string', isOptional: true },
        { name: 'assistant_message',    type: 'string', isOptional: true },
        { name: 'usage',                type: 'string', isOptional: true }, // JSON
        { name: 'collection',           type: 'string', isOptional: true },
        { name: 'is_relay',             type: 'boolean' },
        { name: 'chunk_index_map',      type: 'string', isOptional: true }, // JSON
        { name: 'kontext_meta',         type: 'string', isOptional: true }, // JSON
        { name: 'created_at',           type: 'number' },
        { name: 'updated_at',           type: 'number' },
      ],
    }),
    tableSchema({
      name: 'references',
      columns: [
        { name: 'turn_id',        type: 'string', isIndexed: true },
        { name: 'ref_index',      type: 'number', isOptional: true },
        { name: 'chunk_id',       type: 'string', isOptional: true, isIndexed: true },
        { name: 'relevance',      type: 'number', isOptional: true },
        { name: 'source_title',   type: 'string', isOptional: true },
        { name: 'segment_title',  type: 'string', isOptional: true },
        { name: 'created_at',     type: 'number' },
        { name: 'updated_at',     type: 'number' },
      ],
    }),
  ],
});
