# Architecture

Elora is a local-first Expo app with Firebase as its only backend. All user data is written to on-device SQLite first and synchronised to Firestore in the background. The app stays fully usable offline.

## Layers

```
app/                    Screens and navigation (Expo Router). Thin: composes components and calls features.
src/components/         Presentational UI. No business logic, no Firebase or SQLite calls.
src/features/<name>/    Feature modules: schemas, repositories, hooks and feature-specific components.
src/services/           Cross-cutting services: synchronization, connectivity, notifications, alarm, backup.
src/database/           SQLite access: connection, migrations, row schemas, generic repositories.
src/firebase/           Firebase SDK wrappers: app, auth, firestore, storage, functions.
src/store/              Zustand stores for global app state (auth, settings, network, sync).
src/theme/              Colour tokens, spacing, typography, and the useTheme() hook.
src/config/, constants/, utils/, hooks/, types/
firebase/               Security rules, indexes and Cloud Functions (deployed with firebase-tools).
plugins/                Expo config plugins for native code (e.g. the Android alarm, Phase 2).
```

Dependencies point downward. Screens use features and components. Features use services, database and firebase. Components never import from features.

## Navigation

```
app/_layout.tsx            Root stack. Boots services and gates routes with Stack.Protected.
├── (auth)/                Visible only when signed out: welcome, login (sign in / sign up / reset).
├── (tabs)/                Visible only when signed in: Home, Assistant, News, Journal, More.
├── settings/              Signed in.
└── admin/                 Signed in and listed in adminUsers (UI gate; rules enforce access).
```

The root layout keeps the splash screen visible until the local database is migrated and Firebase Auth has restored the session. If Firebase isn't configured yet, it shows a setup notice instead.

## Startup sequence (`useAppBootstrap`)

1. Open `elora.db` and run pending migrations (`PRAGMA user_version`).
2. Subscribe to Firebase Auth. On sign-in, check `adminUsers/{uid}` to decide whether to show admin UI.
3. Start the NetInfo listener and update `useNetworkStore`.
4. Sync on sign-in, on reconnect and whenever the app returns to the foreground.

## Local-first synchronisation

### Writing

Feature code never writes to Firestore directly for synced data. It uses a repository:

```ts
// src/features/tasks/repository.ts (Phase 6 example)
export const tasksRepository = defineSyncableRepository<Task>({
  table: 'tasks',
  collection: 'tasks',
  fields: {
    title: { column: 'title', type: 'text' },
    priority: { column: 'priority', type: 'text' },
    dueAt: { column: 'due_at', type: 'integer' },
    completed: { column: 'completed', type: 'boolean' },
    tags: { column: 'tags', type: 'json' },
  },
});

await tasksRepository.create(uid, { title: 'Call bank', priority: 'high', dueAt, completed: false, tags: [] });
```

`create`, `update` and `remove` do the following:

1. Write the row to SQLite with `sync_status = 'pending'`.
2. In the same transaction, add or replace a `sync_queue` entry for that document. There is at most one entry per document.
3. Notify subscribers so the UI refreshes, and schedule a sync (debounced by 1.5 s).

The UI never waits for the network.

Deletes are soft. The row becomes a tombstone (`deleted = 1`) and is pushed like any other change, so other devices learn about it.

### Push

For each queue entry, oldest first, the engine reads the **current** row and writes it with `setDoc` to `users/{uid}/{collection}/{id}`, adding `serverUpdatedAt: serverTimestamp()`. On success it marks the row `synced`, but only if `updated_at` hasn't changed since it was read, and removes the queue entry. Transient errors (`unavailable`, `deadline-exceeded`) stop the push loop until the next trigger. Other errors are recorded on the entry (`attempts`, `last_error`).

### Pull

For each registered collection, the engine queries documents with `serverUpdatedAt > last_pulled_at`, in pages of 200. The cursor is kept per user and collection in `sync_state` and uses server time, so device clock skew can't cause missed changes.

### Conflict strategy: last write wins

- If the local row is `pending` and its `updatedAt` is greater than or equal to the remote `updatedAt`, the local version wins. It stays queued and will be pushed.
- Otherwise the remote version replaces the local row, and any queued push for that document is dropped.

`updatedAt` is a client timestamp in milliseconds, and each update bumps it to at least the previous value + 1. This is the right trade-off for a single-person, multi-device app. A field-level merge can be added later per feature if needed.

### Adding a synced feature

1. Add a migration in `src/database/migrations/` that creates the table with the shared sync columns (listed in `001-initial.ts`), and append it to the `migrations` array.
2. Define the entity type and schema, then create the repository with `defineSyncableRepository`.
3. Import the repository module at startup so it registers with the sync engine. This happens naturally when a screen imports it. For background-only features, import it from the feature's index.
4. Add the collection to `syncedCollections()` in `firebase/firestore.rules` if it isn't already listed.

## Notifications and alarms (overview)

The full design will be in `NOTIFICATIONS.md` and `ALARM_IMPLEMENTATION.md`, both written in Phase 2.

- **Local notifications** (`expo-notifications`) handle reminders, routines and tasks. They are scheduled on the device and work offline.
- **Push notifications** (FCM) handle breaking news and backend-triggered alerts only.
- **The wake-up alarm** is a dedicated native Android implementation (exact alarm, full-screen intent, reboot recovery) added through an Expo config plugin in `plugins/alarm-plugin/`. It never depends on FCM.

## Design system

The visual foundation is black and white, with light and dark modes and a user preference (System, Light or Dark) persisted in AsyncStorage. Every component reads colours from `useTheme()`, so nothing hardcodes a colour. Icons are `lucide-react-native` at a 1.75 stroke.
