import type { Migration } from './types';

/**
 * Foundation tables shared by every feature.
 *
 * Feature tables (reminders, tasks, journals, ...) are added by later
 * migrations. Each syncable table must include these columns:
 *
 *   id TEXT PRIMARY KEY NOT NULL,
 *   user_id TEXT NOT NULL,
 *   created_at INTEGER NOT NULL,
 *   updated_at INTEGER NOT NULL,
 *   deleted INTEGER NOT NULL DEFAULT 0,
 *   sync_status TEXT NOT NULL DEFAULT 'pending'
 *
 * Never edit a migration that has shipped. Add a new one instead.
 */
export const migration001Initial: Migration = {
  version: 1,
  name: 'initial',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sync_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        collection TEXT NOT NULL,
        doc_id TEXT NOT NULL,
        op TEXT NOT NULL CHECK (op IN ('upsert', 'delete')),
        created_at INTEGER NOT NULL,
        attempts INTEGER NOT NULL DEFAULT 0,
        last_error TEXT
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_sync_queue_doc
        ON sync_queue (user_id, collection, doc_id);

      CREATE TABLE IF NOT EXISTS sync_state (
        user_id TEXT NOT NULL,
        collection TEXT NOT NULL,
        last_pulled_at INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (user_id, collection)
      );

      CREATE TABLE IF NOT EXISTS kv_store (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
  },
};
