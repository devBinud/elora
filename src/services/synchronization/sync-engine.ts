import { FirebaseError } from 'firebase/app';
import {
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
} from 'firebase/firestore';

import { userCollectionRef, userItemRef } from '@/firebase/firestore';
import { syncQueueRepository } from '@/database/repositories/sync-queue-repository';
import { entityToRemote, remoteToEntity } from '@/database/schemas/entity-schema';
import { getLocalDb } from '@/database/sqlite';
import { useAuthStore } from '@/store/auth-store';
import { useNetworkStore } from '@/store/network-store';
import { useSyncStore } from '@/store/sync-store';

import { getRegisteredRepositories, getRepository } from './sync-registry';

const PULL_PAGE_SIZE = 200;
const REQUEST_DEBOUNCE_MS = 1500;

/** Errors that mean "try again later", so the push loop should stop for now. */
const TRANSIENT_CODES = new Set(['unavailable', 'deadline-exceeded', 'resource-exhausted']);

let runningSync: Promise<void> | null = null;
let rerunRequested = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function errorMessage(error: unknown): string {
  if (error instanceof FirebaseError) return `${error.code}: ${error.message}`;
  if (error instanceof Error) return error.message;
  return String(error);
}

function isTransient(error: unknown): boolean {
  return error instanceof FirebaseError && TRANSIENT_CODES.has(error.code);
}

/**
 * Pushes queued local changes to Firestore.
 *
 * The payload is built from the *current* local row, so the latest state is
 * always sent. Deletions are pushed as tombstones (`deleted: true`) so other
 * devices learn about them on their next pull.
 */
async function pushPending(uid: string): Promise<void> {
  const db = await getLocalDb();
  const pending = await syncQueueRepository.listPending(db, uid);

  for (const item of pending) {
    const repository = getRepository(item.collection);
    if (!repository) continue; // Feature not registered in this build; keep queued.

    const stored = await repository.getForSync(db, uid, item.doc_id);
    if (!stored) {
      await syncQueueRepository.remove(db, item.id);
      continue;
    }
    const { syncStatus: _syncStatus, ...entity } = stored;

    try {
      await setDoc(userItemRef(uid, item.collection, item.doc_id), {
        ...entityToRemote(repository.schema, entity),
        serverUpdatedAt: serverTimestamp(),
      });
      await repository.markSynced(db, item.doc_id, entity.updatedAt);
      await syncQueueRepository.remove(db, item.id);
    } catch (error) {
      await syncQueueRepository.markFailed(db, item.id, errorMessage(error));
      if (isTransient(error)) throw error;
    }
  }
}

/**
 * Pulls remote changes newer than the last pull cursor (server time).
 *
 * Conflict strategy: last write wins by client `updatedAt`. A local change
 * that is still pending and newer than the remote one is kept and will be
 * pushed. Otherwise the remote version replaces the local row and any queued
 * push for that document is dropped.
 */
async function pullChanges(uid: string): Promise<void> {
  const db = await getLocalDb();

  for (const repository of getRegisteredRepositories()) {
    const collection = repository.schema.collection;
    let cursor = await syncQueueRepository.getLastPulledAt(db, uid, collection);

    for (;;) {
      const snapshot = await getDocs(
        query(
          userCollectionRef(uid, collection),
          where('serverUpdatedAt', '>', Timestamp.fromMillis(cursor)),
          orderBy('serverUpdatedAt', 'asc'),
          limit(PULL_PAGE_SIZE),
        ),
      );
      if (snapshot.empty) break;

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const remote = remoteToEntity(repository.schema, docSnap.id, data);
        remote.userId = uid;

        const local = await repository.getForSync(db, uid, docSnap.id);
        const localWins =
          local?.syncStatus === 'pending' && local.updatedAt >= remote.updatedAt;

        if (!localWins) {
          await db.withTransactionAsync(async () => {
            await repository.applyRemote(db, remote);
            await syncQueueRepository.removeForDoc(db, uid, collection, docSnap.id);
          });
        }

        const serverTime = data.serverUpdatedAt;
        if (serverTime instanceof Timestamp) {
          cursor = Math.max(cursor, serverTime.toMillis());
        }
      }

      await syncQueueRepository.setLastPulledAt(db, uid, collection, cursor);
      if (snapshot.size < PULL_PAGE_SIZE) break;
    }
  }
}

async function runSync(uid: string): Promise<void> {
  const store = useSyncStore.getState();
  store.setSyncing(true);
  try {
    await pushPending(uid);
    await pullChanges(uid);
    store.setSynced(Date.now());
  } catch (error) {
    store.setError(errorMessage(error));
  } finally {
    const db = await getLocalDb();
    store.setPendingCount(await syncQueueRepository.count(db, uid));
    store.setSyncing(false);
  }
}

/**
 * Runs a full sync (push, then pull) for the signed-in user. Concurrent calls
 * are coalesced: if a sync is already running, one more run is scheduled
 * after it finishes.
 */
export async function syncNow(): Promise<void> {
  const { user } = useAuthStore.getState();
  const { isOnline } = useNetworkStore.getState();
  if (!user || isOnline === false) return;

  if (runningSync) {
    rerunRequested = true;
    return runningSync;
  }

  runningSync = (async () => {
    do {
      rerunRequested = false;
      await runSync(user.uid);
    } while (rerunRequested);
  })().finally(() => {
    runningSync = null;
  });
  return runningSync;
}

/** Schedules a sync shortly after local changes, batching rapid edits. */
export function requestSync(): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void syncNow();
  }, REQUEST_DEBOUNCE_MS);
}

/** Refreshes the pending-change counter shown in the UI. */
export async function refreshPendingCount(): Promise<void> {
  const { user } = useAuthStore.getState();
  if (!user) return;
  const db = await getLocalDb();
  useSyncStore.getState().setPendingCount(await syncQueueRepository.count(db, user.uid));
}
