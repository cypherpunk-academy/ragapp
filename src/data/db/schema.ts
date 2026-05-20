import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const schema = appSchema({
  version: 4,
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
        { name: 'chunk_id',      type: 'string', isIndexed: true },
        { name: 'collection',    type: 'string', isIndexed: true },
        { name: 'source_id',     type: 'string', isIndexed: true },
        { name: 'segment_id',    type: 'string', isOptional: true },
        { name: 'chunk_type',    type: 'string' },
        { name: 'text',          type: 'string' },
        { name: 'deprecated_at', type: 'number', isOptional: true },
        { name: 'created_at',    type: 'number' },
        { name: 'updated_at',    type: 'number' },
      ],
    }),
    tableSchema({
      name: 'notes',
      columns: [
        { name: 'user_id',      type: 'string', isIndexed: true },
        { name: 'paragraph_id', type: 'string', isIndexed: true, isOptional: true },
        { name: 'segment_id',   type: 'string', isOptional: true },
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
        { name: 'talk_id',          type: 'string', isIndexed: true },
        { name: 'user_id',          type: 'string', isIndexed: true },
        { name: 'collection',       type: 'string', isOptional: true },
        { name: 'title',            type: 'string', isOptional: true },
        { name: 'summary',          type: 'string', isOptional: true },
        { name: 'context_mode',     type: 'string', isOptional: true }, // 'free' | 'paragraph' | 'segment'
        { name: 'context_ids',      type: 'string', isOptional: true }, // JSON
        { name: 'context_paragraph_id', type: 'string', isOptional: true, isIndexed: true },
        { name: 'publishing_status',type: 'string' }, // 'private' | 'link' | 'friends' | 'public'
        { name: 'created_at',       type: 'number' },
        { name: 'updated_at',       type: 'number' },
      ],
    }),
    tableSchema({
      name: 'turns',
      columns: [
        { name: 'talk_id',             type: 'string', isIndexed: true },
        { name: 'turn_index',          type: 'number' },
        { name: 'assistant_personality',type: 'string', isOptional: true },
        { name: 'user_message',        type: 'string' },
        { name: 'assistant_message',   type: 'string', isOptional: true },
        { name: 'chunk_index_map',     type: 'string', isOptional: true }, // JSON
        { name: 'created_at',          type: 'number' },
        { name: 'updated_at',          type: 'number' },
      ],
    }),
    tableSchema({
      name: 'references',
      columns: [
        { name: 'ref_id',         type: 'string', isIndexed: true },
        { name: 'paragraph_id',   type: 'string', isIndexed: true },
        { name: 'turn_id',        type: 'string', isOptional: true, isIndexed: true },
        { name: 'chunk_id',       type: 'string', isOptional: true, isIndexed: true },
        { name: 'ref_index',      type: 'number' },
        { name: 'ref_kind',       type: 'string', isOptional: true }, // begriff | zitat | buch | vortrag
        { name: 'relevance',      type: 'number', isOptional: true },
        { name: 'source_title',   type: 'string', isOptional: true },
        { name: 'segment_title',  type: 'string', isOptional: true },
        { name: 'snippet',        type: 'string', isOptional: true },
        { name: 'created_at',     type: 'number' },
        { name: 'updated_at',     type: 'number' },
      ],
    }),
  ],
});
