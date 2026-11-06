import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';

import { devProxyHost } from '@/config/dev-proxy';

import { getFirebaseApp } from './config';

let storageInstance: FirebaseStorage | null = null;

export function getFileStorage(): FirebaseStorage {
  if (storageInstance) return storageInstance;
  storageInstance = getStorage(getFirebaseApp());
  if (devProxyHost) {
    // Development: point Storage at the PC proxy (plain HTTP, same paths).
    const [host, port] = devProxyHost.split(':');
    connectStorageEmulator(storageInstance, host, Number(port));
  }
  return storageInstance;
}
