import type { Migration } from './types';

/**
 * Voice reminders the user creates in the app. Synced to Firestore
 * `users/{uid}/reminders`. Feature columns are nullable because remote
 * documents may lack a field.
 */
export const migration003VoiceReminders: Migration = {
  version: 3,
  name: 'voice-reminders',
  async up(db) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS voice_reminders (
        id TEXT PRIMARY KEY NOT NULL,
        user_id TEXT NOT NULL,
        time TEXT,
        message TEXT,
        days TEXT,
        enabled INTEGER,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        deleted INTEGER NOT NULL DEFAULT 0,
        sync_status TEXT NOT NULL DEFAULT 'pending'
      );
      CREATE INDEX IF NOT EXISTS idx_voice_reminders_user
        ON voice_reminders (user_id, deleted, time);
    `);
  },
};
