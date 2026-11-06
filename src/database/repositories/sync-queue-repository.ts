import type { SQLiteDatabase } from 'expo-sqlite';

import type { UserCollectionName } from '@/constants/collections';

import type { SyncOperation, SyncQueueRow } from '../schemas/sync-queue';

/**
 * Pending changes waiting to be pushed to Firestore.
 *
 * There is at most one queue entry per document. Enqueuing again replaces the
 * entry (and gives it a new id), so the engine always pushes the latest local
 * state. If an entry is replaced mid-push, removing the old id is a no-op and
 * the new entry stays queued.
 */
export const syncQueueRepository = {
  async enqueue(
    db: SQLiteDatabase,
    entry: { userId: string; collection: UserCollectionName; docId: string; op: SyncOperation },
  ): Promise<void> {
    await db.runAsync(
      `INSERT OR REPLACE INTO sync_queue (user_id, collection, doc_id, op, created_at, attempts, last_error)
       VALUES (?, ?, ?, ?, ?, 0, NULL)`,
      entry.userId,
      entry.collection,
      entry.docId,
      entry.op,
      Date.now(),
    );
  },

  listPending(db: SQLiteDatabase, userId: string, limit = 100): Promise<SyncQueueRow[]> {
    return db.getAllAsync<SyncQueueRow>(
      'SELECT * FROM sync_queue WHERE user_id = ? ORDER BY id ASC LIMIT ?',
      userId,
      limit,
    );
  },

  async remove(db: SQLiteDatabase, id: number): Promise<void> {
    await db.runAsync('DELETE FROM sync_queue WHERE id = ?', id);
  },

  async removeForDoc(
    db: SQLiteDatabase,
    userId: string,
    collection: UserCollectionName,
    docId: string,
  ): Promise<void> {
    await db.runAsync(
      'DELETE FROM sync_queue WHERE user_id = ? AND collection = ? AND doc_id = ?',
      userId,
      collection,
      docId,
    );
  },

  async markFailed(db: SQLiteDatabase, id: number, error: string): Promise<void> {
    await db.runAsync(
      'UPDATE sync_queue SET attempts = attempts + 1, last_error = ? WHERE id = ?',
      error.slice(0, 500),
      id,
    );
  },

  async count(db: SQLiteDatabase, userId: string): Promise<number> {
    const row = await db.getFirstAsync<{ total: number }>(
      'SELECT COUNT(*) AS total FROM sync_queue WHERE user_id = ?',
      userId,
    );
    return row?.total ?? 0;
  },

  async getLastPulledAt(
    db: SQLiteDatabase,
    userId: string,
    collection: UserCollectionName,
  ): Promise<number> {
    const row = await db.getFirstAsync<{ last_pulled_at: number }>(
      'SELECT last_pulled_at FROM sync_state WHERE user_id = ? AND collection = ?',
      userId,
      collection,
    );
    return row?.last_pulled_at ?? 0;
  },

  async setLastPulledAt(
    db: SQLiteDatabase,
    userId: string,
    collection: UserCollectionName,
    timestamp: number,
  ): Promise<void> {
    await db.runAsync(
      `INSERT INTO sync_state (user_id, collection, last_pulled_at) VALUES (?, ?, ?)
       ON CONFLICT (user_id, collection) DO UPDATE SET last_pulled_at = excluded.last_pulled_at`,
      userId,
      collection,
      timestamp,
    );
  },
};
