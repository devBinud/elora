import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { runMigrations } from './migrations';

const DATABASE_NAME = 'elora.db';

let databasePromise: Promise<SQLiteDatabase> | null = null;

async function openAndMigrate(): Promise<SQLiteDatabase> {
  const db = await openDatabaseAsync(DATABASE_NAME);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  await runMigrations(db);
  return db;
}

/**
 * Returns the app's local database, opening it and running migrations on
 * first use. Safe to call from anywhere (UI, services, background tasks).
 */
export function getLocalDb(): Promise<SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = openAndMigrate().catch((error: unknown) => {
      // Allow a retry on the next call instead of caching the failure.
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}
