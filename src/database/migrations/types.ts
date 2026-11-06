import type { SQLiteDatabase } from 'expo-sqlite';

export type Migration = {
  /** Must be unique and increase by one per migration. */
  version: number;
  name: string;
  up: (db: SQLiteDatabase) => Promise<void>;
};
