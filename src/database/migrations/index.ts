import type { SQLiteDatabase } from 'expo-sqlite';

import { migration001Initial } from './001-initial';
import { migration002JournalEntries } from './002-journal-entries';
import { migration003VoiceReminders } from './003-voice-reminders';
import type { Migration } from './types';

/** Ordered list of all migrations. Append new migrations to the end. */
export const migrations: Migration[] = [
  migration001Initial,
  migration002JournalEntries,
  migration003VoiceReminders,
];

/**
 * Brings the database schema up to date using SQLite's `user_version` pragma.
 * Each migration runs in its own transaction together with its version bump,
 * so a failure leaves the database at the last successful version.
 */
export async function runMigrations(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  for (const migration of migrations) {
    if (migration.version <= currentVersion) continue;
    await db.withTransactionAsync(async () => {
      await migration.up(db);
      // PRAGMA statements cannot take bound parameters; version is a trusted integer.
      await db.execAsync(`PRAGMA user_version = ${Math.trunc(migration.version)}`);
    });
  }
}
