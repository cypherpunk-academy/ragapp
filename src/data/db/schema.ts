import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 14,
  tables: [
    tableSchema({
      name: 'sources',
      columns: [
        { name: 'title',      type: 'string' },
        { name: 'author',     type: 'string' },
        { name: 'language',   type: 'string', isOptional: true },
        { name: 'year',       type: 'number', isOptional: true },
        { name: 'book_index', type: 'number', isOptional: true },
        { name: 'is_primary',  type: 'boolean' },
        { name: 'sort_order',  type: 'number', isOptional: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
      ],
    }),
    tableSchema({
      name: 'paragraphs',
      columns: [
        { name: 'source_id',        type: 'string', isIndexed: true },
        { name: 'language',         type: 'string', isOptional: true },
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
        { name: 'title',              type: 'string', isOptional: true },
        { name: 'personality',        type: 'string', isOptional: true },
        { name: 'summary',            type: 'string', isOptional: true },
        { name: 'usage',              type: 'string', isOptional: true }, // JSON
        { name: 'kontext_meta',       type: 'string', isOptional: true }, // JSON
        { name: 'publishing_status',  type: 'string' },
        { name: 'kontext_source_id',  type: 'string', isOptional: true, isIndexed: true },
        { name: 'kontext_paragraph_id', type: 'string', isOptional: true },
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
        { name: 'personality',          type: 'string', isOptional: true },
        { name: 'user_message',         type: 'string', isOptional: true },
        { name: 'assistant_message',    type: 'string', isOptional: true },
        { name: 'usage',                type: 'string', isOptional: true }, // JSON
        { name: 'collection',           type: 'string', isOptional: true },
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
