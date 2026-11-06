# Firestore schema

Collection names are defined in `src/constants/collections.ts`. Security rules are in `firebase/firestore.rules`.

```text
users/{userId}
├── profile/settings                  user preferences (owner only)
├── reminders/{reminderId}            synced
├── routines/{routineId}              synced
├── alarms/{alarmId}                  synced
├── tasks/{taskId}                    synced
├── journals/{entryId}                synced
├── bookmarks/{articleId}             synced
├── notificationHistory/{id}          synced
└── devices/{deviceId}                FCM token and device info (owner only)

newsCategories/{categoryId}           read: signed in · write: admin
newsSources/{sourceId}                read: signed in · write: admin
newsArticles/{articleId}              read: signed in · write: Cloud Functions only
appConfig/{configId}                  read: signed in · write: admin
adminUsers/{userId}                   get: self · list/write: nobody (console / Admin SDK)
```

## Synced documents

Every document in a synced subcollection is written by the sync engine and must contain these fields:

| Field | Type | Notes |
| --- | --- | --- |
| `userId` | string | Must equal the path's `{userId}` (enforced by rules) |
| `createdAt` | number | Client ms timestamp |
| `updatedAt` | number | Client ms timestamp, used for last-write-wins |
| `deleted` | bool | Tombstone. Deleted items stay until the scheduled clean-up removes them |
| `serverUpdatedAt` | timestamp | Must be `request.time` (`serverTimestamp()`), used as the pull cursor |
| *feature fields* | any | Defined by each feature's `EntitySchema` |

The document ID is the client-generated UUID, which is also the SQLite primary key.

Feature field definitions are added to this file as each phase lands.

## Indexes

- Synced pulls use a single-field range on `serverUpdatedAt`, which Firestore indexes automatically.
- `newsArticles`: composite indexes on (`categoryId`, `publishedAt desc`) and (`important`, `publishedAt desc`) are defined ahead of time in `firebase/firestore.indexes.json` for Phase 4.

## Local SQLite tables

| Table | Purpose |
| --- | --- |
| `sync_queue` | One pending push per document (`user_id`, `collection`, `doc_id`, `op`, `attempts`, `last_error`) |
| `sync_state` | Pull cursor per user and collection (`last_pulled_at`, server time in ms) |
| `kv_store` | Small local key/value data that must live alongside the database |
| *feature tables* | Added by later migrations. Each includes `id`, `user_id`, `created_at`, `updated_at`, `deleted`, `sync_status` |

## Journal entries: `users/{uid}/journals/{entryId}`

Text only, no images. The local copy lives in the SQLite table `journal_entries` (migration 002) and syncs through the standard sync engine (see `src/features/journal/journal-repository.ts`).

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | May be empty ("Untitled" in the UI) |
| `body` | string | Plain text |
| `category` | string | `journal` \| `blog` \| `idea` |
| `favorite` | boolean | Shown under "★ Saved" |
| `userId`, `createdAt`, `updatedAt`, `deleted`, `serverUpdatedAt` | | Standard synced-document fields |

Entries left completely empty when the editor closes are deleted, so blank drafts don't pile up.
