import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { schema } from './schema';
import { migrations } from './migrations';
import Paragraph from './models/Paragraph';
import Chunk from './models/Chunk';
import Note from './models/Note';
import Bookmark from './models/Bookmark';
import Talk from './models/Talk';
import Turn from './models/Turn';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'ragapp',
  jsi: true,
});

export const database = new Database({
  adapter,
  modelClasses: [Paragraph, Chunk, Note, Bookmark, Talk, Turn],
});

export { Paragraph, Chunk, Note, Bookmark, Talk, Turn };
