import { randomUUID } from 'expo-crypto';

/**
 * Generates an id for a new entity. The same id is used locally (SQLite) and
 * remotely (Firestore document id), so items can be created offline.
 */
export function createId(): string {
  return randomUUID();
}
