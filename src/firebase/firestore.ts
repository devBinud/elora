import {
  collection,
  doc,
  getDoc,
  getFirestore,
  initializeFirestore,
  memoryLocalCache,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';

import {
  GlobalCollections,
  PROFILE_SETTINGS_DOC,
  UserCollections,
  type UserCollectionName,
} from '@/constants/collections';

import { devProxyHost } from '@/config/dev-proxy';
import { withTimeout } from '@/utils/with-timeout';

import { getFirebaseApp } from './config';

let firestoreInstance: Firestore | null = null;

/**
 * Returns the Firestore instance.
 *
 * Offline support comes from Elora's own SQLite store and sync queue, not from
 * Firestore's IndexedDB cache (which is unavailable in React Native). Firestore
 * therefore uses an in-memory cache.
 */
export function getDb(): Firestore {
  if (firestoreInstance) return firestoreInstance;
  const app = getFirebaseApp();
  try {
    firestoreInstance = initializeFirestore(app, {
      localCache: memoryLocalCache(),
      ignoreUndefinedProperties: true,
      ...(devProxyHost
        ? // Development: plain HTTP long-polling through the PC proxy.
          { host: devProxyHost, ssl: false, experimentalForceLongPolling: true }
        : { experimentalAutoDetectLongPolling: true }),
    });
  } catch {
    // Already initialised (e.g. after Fast Refresh).
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
}

export function userDocRef(uid: string): DocumentReference<DocumentData> {
  return doc(getDb(), GlobalCollections.users, uid);
}

export function userCollectionRef(
  uid: string,
  name: UserCollectionName,
): CollectionReference<DocumentData> {
  return collection(getDb(), GlobalCollections.users, uid, name);
}

export function userItemRef(
  uid: string,
  name: UserCollectionName,
  id: string,
): DocumentReference<DocumentData> {
  return doc(getDb(), GlobalCollections.users, uid, name, id);
}

export function userSettingsRef(uid: string): DocumentReference<DocumentData> {
  return userItemRef(uid, UserCollections.profile, PROFILE_SETTINGS_DOC);
}

export function globalCollectionRef(
  name: (typeof GlobalCollections)[keyof typeof GlobalCollections],
): CollectionReference<DocumentData> {
  return collection(getDb(), name);
}

/**
 * Checks whether the user has an `adminUsers/{uid}` document. Security rules
 * let users read only their own entry, and nobody can write entries from the
 * client. The result only decides what the UI shows; rules enforce access.
 */
export async function fetchIsAdmin(uid: string): Promise<boolean> {
  try {
    const snapshot = await withTimeout(
      getDoc(doc(getDb(), GlobalCollections.adminUsers, uid)),
      15_000,
      'Admin check',
    );
    return snapshot.exists();
  } catch (error) {
    if (__DEV__) console.log('[firestore] admin check failed', error);
    return false;
  }
}
