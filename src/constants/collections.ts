/**
 * Firestore collection names. Keep every path in one place so that renames and
 * security rules stay in step. See docs/FIRESTORE_SCHEMA.md.
 */

/** Top-level (global) collections. */
export const GlobalCollections = {
  users: 'users',
  newsCategories: 'newsCategories',
  newsSources: 'newsSources',
  newsArticles: 'newsArticles',
  appConfig: 'appConfig',
  adminUsers: 'adminUsers',
} as const;

/** Subcollections under `users/{userId}`. */
export const UserCollections = {
  profile: 'profile',
  reminders: 'reminders',
  routines: 'routines',
  alarms: 'alarms',
  tasks: 'tasks',
  journals: 'journals',
  bookmarks: 'bookmarks',
  notificationHistory: 'notificationHistory',
  devices: 'devices',
} as const;

export type UserCollectionName = (typeof UserCollections)[keyof typeof UserCollections];

/** Document id of the settings doc inside `users/{uid}/profile`. */
export const PROFILE_SETTINGS_DOC = 'settings';
