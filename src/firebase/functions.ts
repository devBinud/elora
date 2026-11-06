import { getFunctions, httpsCallable, type Functions } from 'firebase/functions';

import { devProxyUrl } from '@/config/dev-proxy';
import { functionsRegion } from '@/config/env';

import { getFirebaseApp } from './config';

let functionsInstance: Functions | null = null;

export function getCloudFunctions(): Functions {
  // A URL instead of a region makes the SDK call `${url}/${functionName}`.
  functionsInstance ??= getFunctions(
    getFirebaseApp(),
    devProxyUrl ? `${devProxyUrl}/functions` : functionsRegion,
  );
  return functionsInstance;
}

/** Calls an HTTPS callable Cloud Function and returns its typed result. */
export async function callFunction<TRequest, TResponse>(
  name: string,
  data: TRequest,
): Promise<TResponse> {
  const callable = httpsCallable<TRequest, TResponse>(getCloudFunctions(), name);
  const result = await callable(data);
  return result.data;
}
