import type { SQLiteBindValue } from 'expo-sqlite';

import type { UserCollectionName } from '@/constants/collections';

export type SyncStatus = 'pending' | 'synced';

/**
 * Fields every locally stored, cloud-synchronised entity carries.
 *
 * - `id` is a client-generated UUID, used as both SQLite primary key and
 *   Firestore document id.
 * - `updatedAt` is a client timestamp (ms) used for last-write-wins conflict
 *   resolution.
 * - `deleted` is a tombstone flag so deletions propagate to other devices.
 */
export type SyncableEntity = {
  id: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  deleted: boolean;
};

/** A stored entity together with its local sync state. */
export type Stored<T extends SyncableEntity> = T & { syncStatus: SyncStatus };

export type FieldType = 'text' | 'integer' | 'real' | 'boolean' | 'json';

export type FieldSpec = {
  /** SQLite column name (snake_case). */
  column: string;
  type: FieldType;
};

/** The entity's own fields (everything except the shared sync fields). */
export type EntityFields<T extends SyncableEntity> = Omit<T, keyof SyncableEntity>;

/**
 * Describes how a feature entity maps to a SQLite table and a Firestore
 * subcollection under `users/{uid}`. One schema per syncable feature
 * (reminders, tasks, journals, ...).
 */
export type EntitySchema<T extends SyncableEntity> = {
  table: string;
  collection: UserCollectionName;
  fields: { [K in keyof EntityFields<T>]-?: FieldSpec };
};

/** Columns shared by every syncable table, as stored in SQLite. */
export type SyncableRow = {
  id: string;
  user_id: string;
  created_at: number;
  updated_at: number;
  deleted: number;
  sync_status: SyncStatus;
};

type Row = Record<string, unknown>;

function encodeValue(value: unknown, type: FieldType): SQLiteBindValue {
  if (value === undefined || value === null) return null;
  switch (type) {
    case 'boolean':
      return value ? 1 : 0;
    case 'json':
      return JSON.stringify(value);
    case 'integer':
    case 'real':
      return Number(value);
    case 'text':
      return String(value);
  }
}

function decodeValue(value: unknown, type: FieldType): unknown {
  if (value === undefined || value === null) return null;
  switch (type) {
    case 'boolean':
      return value === 1 || value === true;
    case 'json':
      try {
        return typeof value === 'string' ? JSON.parse(value) : value;
      } catch {
        return null;
      }
    case 'integer':
    case 'real':
      return Number(value);
    case 'text':
      return String(value);
  }
}

function fieldEntries<T extends SyncableEntity>(schema: EntitySchema<T>): [string, FieldSpec][] {
  return Object.entries(schema.fields) as [string, FieldSpec][];
}

/** Entity -> SQLite column values (excluding `sync_status`). */
export function entityToRow<T extends SyncableEntity>(
  schema: EntitySchema<T>,
  entity: T,
): Record<string, SQLiteBindValue> {
  const row: Record<string, SQLiteBindValue> = {
    id: entity.id,
    user_id: entity.userId,
    created_at: entity.createdAt,
    updated_at: entity.updatedAt,
    deleted: entity.deleted ? 1 : 0,
  };
  const record = entity as unknown as Row;
  for (const [key, spec] of fieldEntries(schema)) {
    row[spec.column] = encodeValue(record[key], spec.type);
  }
  return row;
}

/** SQLite row -> entity with sync status. */
export function rowToEntity<T extends SyncableEntity>(
  schema: EntitySchema<T>,
  row: Row,
): Stored<T> {
  const entity: Row = {
    id: row.id,
    userId: row.user_id,
    createdAt: Number(row.created_at),
    updatedAt: Number(row.updated_at),
    deleted: row.deleted === 1,
    syncStatus: row.sync_status,
  };
  for (const [key, spec] of fieldEntries(schema)) {
    entity[key] = decodeValue(row[spec.column], spec.type);
  }
  return entity as Stored<T>;
}

/** Entity -> Firestore document data (camelCase, no local-only fields). */
export function entityToRemote<T extends SyncableEntity>(
  schema: EntitySchema<T>,
  entity: T,
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    userId: entity.userId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
    deleted: entity.deleted,
  };
  const record = entity as unknown as Row;
  for (const [key] of fieldEntries(schema)) {
    data[key] = record[key] ?? null;
  }
  return data;
}

/** Firestore document data -> entity. Missing fields become `null`. */
export function remoteToEntity<T extends SyncableEntity>(
  schema: EntitySchema<T>,
  id: string,
  data: Record<string, unknown>,
): T {
  const entity: Row = {
    id,
    userId: data.userId,
    createdAt: Number(data.createdAt ?? 0),
    updatedAt: Number(data.updatedAt ?? 0),
    deleted: data.deleted === true,
  };
  for (const [key] of fieldEntries(schema)) {
    entity[key] = data[key] ?? null;
  }
  return entity as T;
}
