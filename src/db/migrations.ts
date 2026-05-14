import { addColumns, createTable, schemaMigrations } from '@nozbe/watermelondb/Schema/migrations';

export const migrations = schemaMigrations({
  migrations: [
    // Version 1 is the initial schema — no migration needed.
    // Future migrations go here when schema.version increments.
  ],
});
