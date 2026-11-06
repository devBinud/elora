import type { Migration } from './types';

/**
 * Journal entries (text only). Synced to Firestore `users/{uid}/journals`.
 * Feature columns are nullable because remote documents may lack a field.
 */
export const migration002JournalEntries: Migration = {
  version: 2,
  name: 'journal-entries',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS journal_entries (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        title TEXT,
        body TEXT,
        category TEXT,
        favorite INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );
      CREATE INDEX IF NOT EXISTS idx_journal_entries_user_updated
        ON journal_entries (user_id, deleted, updated_at DESC);
    `);
  },
};
