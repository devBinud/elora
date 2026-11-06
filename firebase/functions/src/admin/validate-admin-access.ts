import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';

/**
 * Returns whether the caller is an Elora admin.
 *
 * Admin status is the existence of `adminUsers/{uid}`, which only the Admin
 * SDK or the Firebase console can create. Other functions should call
 * `assertAdmin` before doing privileged work.
 */
export async function isAdminUid(uid: string): Promise<boolean> {
  const snapshot = await getFirestore().collection('adminUsers').doc(uid).get();
  return snapshot.exists;
}

export async function assertAdmin(uid: string | undefined): Promise<string> {
  if (!uid) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  if (!(await isAdminUid(uid))) {
    throw new HttpsError('permission-denied', 'Admin access required.');
  }
  return uid;
}

export const validateAdminAccess = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in first.');
  }
  return { isAdmin: await isAdminUid(request.auth.uid) };
});
