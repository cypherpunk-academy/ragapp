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
import Reference from './models/Reference';

const adapter = new SQLiteAdapter({
  schema,
  migrations,
  dbName: 'ragapp',
  jsi: false, // jsi: true only works in dev/production builds, not Expo Go
});

export const database = new Database({
  adapter,
  modelClasses: [Paragraph, Chunk, Note, Bookmark, Talk, Turn, Reference],
});

export { Paragraph, Chunk, Note, Bookmark, Talk, Turn, Reference };
