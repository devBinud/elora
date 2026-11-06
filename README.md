# Elora

A personal assistant app for daily routines, reminders, trusted news, a private journal and tasks.
It is built with **Expo SDK 54 (React Native) + TypeScript**, and **Firebase** is the only backend.

The full product specification is in [project-planning.md](project-planning.md).

## Status

| Phase | Scope | Status |
| --- | --- | --- |
| 1. Foundation | Expo, Router, Firebase, Auth, Firestore, SQLite, sync engine, navigation, UI kit | ✅ Done |
| 2. Personal Assistant | Dashboard, reminders, local notifications, native alarm, routines | ⏳ Next |
| 3. Admin Control Centre | Reminder/routine/news/category admin, settings | — |
| 4. News Intelligence | RSS ingestion via Cloud Functions, feed, bookmarks, push | — |
| 5. Personal Journal | Editor, autosave, offline writing, tags, search | — |
| 6. Tasks & Productivity | Tasks, priorities, deadlines, reminders | — |
| 7. Finalisation | Rule hardening, reliability testing, production build | — |

## Quick start

```bash
npm install
cp .env.example .env        # fill in your Firebase web app config
npm start                   # opens in Expo Go (SDK 54); press "a" for Android
```

Phase 1 runs in **Expo Go 54**. The native wake-up alarm (Phase 2) and FCM push (Phase 4) need code that Expo Go can't load, so those phases need a development build:

```bash
npx eas-cli@latest build --profile development --platform android
```

Setup, scripts and troubleshooting are covered in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).
To configure the Firebase project, see [docs/FIREBASE.md](docs/FIREBASE.md).

## Documentation

- [ARCHITECTURE.md](docs/ARCHITECTURE.md): folder layout, layers and the local-first sync design
- [FIREBASE.md](docs/FIREBASE.md): Firebase project setup, rules, functions and admin users
- [FIRESTORE_SCHEMA.md](docs/FIRESTORE_SCHEMA.md): collections, document shapes and security
- [DEVELOPMENT.md](docs/DEVELOPMENT.md): running, building, checks and conventions
