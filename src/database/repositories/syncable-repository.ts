import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';

import { createId } from '@/utils/id';

import {
  entityToRow,
  rowToEntity,
  type EntityFields,
  type EntitySchema,
  type Stored,
  type SyncableEntity,
} from '../schemas/entity-schema';
import { getLocalDb } from '../sqlite';
import { syncQueueRepository } from './sync-queue-repository';

type ChangeListener = () => void;

export type SyncableRepository<T extends SyncableEntity> = {
  schema: EntitySchema<T>;
  getById: (userId: string, id: string) => Promise<Stored<T> | null>;
  /** Lists non-deleted entities, newest first unless `orderBy` is given. */
  list: (
    userId: string,
    options?: { where?: string; params?: SQLiteBindValue[]; orderBy?: string; limit?: number },
  ) => Promise<Stored<T>[]>;
  create: (userId: string, fields: EntityFields<T>) => Promise<Stored<T>>;
  update: (userId: string, id: string, changes: Partial<EntityFields<T>>) => Promise<Stored<T>>;
  remove: (userId: string, id: string) => Promise<void>;
  /** Used by the sync engine: returns the row even if it is a tombstone. */
  getForSync: (db: SQLiteDatabase, userId: string, id: string) => Promise<Stored<T> | null>;
  /** Used by the sync engine to write a remote change into the local table. */
  applyRemote: (db: SQLiteDatabase, entity: T) => Promise<void>;
  /** Marks a row synced, but only if it hasn't changed since `updatedAt`. */
  markSynced: (db: SQLiteDatabase, id: string, updatedAt: number) => Promise<void>;
  subscribe: (listener: ChangeListener) => () => void;
};

/**
 * Creates a local-first repository for a feature entity.
 *
 * Every write goes to SQLite immediately and is added to the sync queue in the
 * same transaction. The UI never waits for Firestore. `onLocalChange` lets the
 * sync engine schedule a push after each write.
 */
export function createSyncableRepository<T extends SyncableEntity>(
  schema: EntitySchema<T>,
  hooks: { onLocalChange?: () => void } = {},
): SyncableRepository<T> {
  const listeners = new Set<ChangeListener>();
  const notify = () => {
    listeners.forEach((listener) => listener());
  };

  async function upsertRow(db: SQLiteDatabase, entity: T, syncStatus: 'pending' | 'synced') {
    const row = { ...entityToRow(schema, entity), sync_status: syncStatus };
    const columns = Object.keys(row);
    const placeholders = columns.map(() => '?').join(', ');
    const updates = columns
      .filter((column) => column !== 'id')
      .map((column) => `${column} = excluded.${column}`)
      .join(', ');
    await db.runAsync(
      `INSERT INTO ${schema.table} (${columns.join(', ')}) VALUES (${placeholders})
       ON CONFLICT (id) DO UPDATE SET ${updates}`,
      Object.values(row),
    );
  }

  async function getRow(db: SQLiteDatabase, userId: string, id: string) {
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM ${schema.table} WHERE id = ? AND user_id = ?`,
      id,
      userId,
    );
    return row ? rowToEntity(schema, row) : null;
  }

  async function writeLocal(entity: T, op: 'upsert' | 'delete') {
    const db = await getLocalDb();
    await db.withTransactionAsync(async () => {
      await upsertRow(db, entity, 'pending');
      await syncQueueRepository.enqueue(db, {
        userId: entity.userId,
        collection: schema.collection,
        docId: entity.id,
        op,
      });
    });
    notify();
    hooks.onLocalChange?.();
  }

  function stripSyncStatus(stored: Stored<T>): T {
    const { syncStatus: _syncStatus, ...entity } = stored;
    return entity as unknown as T;
  }

  return {
    schema,

    async getById(userId, id) {
      const db = await getLocalDb();
      const entity = await getRow(db, userId, id);
      return entity && !entity.deleted ? entity : null;
    },

    async list(userId, options = {}) {
      const db = await getLocalDb();
      const where = options.where ? `AND (${options.where})` : '';
      const orderBy = options.orderBy ?? 'updated_at DESC';
      const limit = options.limit ? `LIMIT ${Math.trunc(options.limit)}` : '';
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM ${schema.table} WHERE user_id = ? AND deleted = 0 ${where}
         ORDER BY ${orderBy} ${limit}`,
        [userId, ...(options.params ?? [])],
      );
      return rows.map((row) => rowToEntity(schema, row));
    },

    async create(userId, fields) {
      const now = Date.now();
      const entity = {
        ...fields,
        id: createId(),
        userId,
        createdAt: now,
        updatedAt: now,
        deleted: false,
      } as unknown as T;
      await writeLocal(entity, 'upsert');
      return { ...entity, syncStatus: 'pending' };
    },

    async update(userId, id, changes) {
      const db = await getLocalDb();
      const existing = await getRow(db, userId, id);
      if (!existing || existing.deleted) {
        throw new Error(`${schema.table}: item ${id} not found`);
      }
      const entity = {
        ...stripSyncStatus(existing),
        ...changes,
        updatedAt: Math.max(Date.now(), existing.updatedAt + 1),
      } as T;
      await writeLocal(entity, 'upsert');
      return { ...entity, syncStatus: 'pending' };
    },

    async remove(userId, id) {
      const db = await getLocalDb();
      const existing = await getRow(db, userId, id);
      if (!existing || existing.deleted) return;
      const entity = {
        ...stripSyncStatus(existing),
        deleted: true,
        updatedAt: Math.max(Date.now(), existing.updatedAt + 1),
      } as T;
      await writeLocal(entity, 'delete');
    },

    getForSync(db, userId, id) {
      return getRow(db, userId, id);
    },

    async applyRemote(db, entity) {
      await upsertRow(db, entity, 'synced');
      notify();
    },

    async markSynced(db, id, updatedAt) {
      await db.runAsync(
        `UPDATE ${schema.table} SET sync_status = 'synced' WHERE id = ? AND updated_at = ?`,
        id,
        updatedAt,
      );
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
