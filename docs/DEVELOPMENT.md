# Development

## Requirements

- Node 22 or later (Cloud Functions target Node 22)
- An Android device or emulator
- An Expo account for EAS builds (`npx eas-cli@latest login`)
- Firebase CLI for deploying rules and functions (`npm i -g firebase-tools`)

## First run

```bash
npm install
cp .env.example .env            # see docs/FIREBASE.md
npm start                       # = expo start --go (opens in Expo Go 54)
```

If the app shows **"Connect Firebase"**, the `.env` values are missing. Restart with `npx expo start --clear` after editing `.env`.

## Development builds

The project targets **Expo SDK 54**, so it opens in Expo Go 54.x. Everything in Phase 1 works in Expo Go: SQLite, SecureStore, local notifications and the Firebase JS SDK.

Expo Go can't load the custom native alarm module (Phase 2) or receive FCM push notifications (Phase 4). For those, build a development client once, then iterate with `npm run start:dev-client`:

```bash
# Cloud build (no Android Studio needed)
npx eas-cli@latest build --profile development --platform android

# Or a local build (needs Android Studio / SDK)
npx expo run:android
```

Rebuild the development client whenever you add a library with native code or change `app.config.ts` plugins.

## Checks

Run these before considering any change done:

```bash
npm run typecheck      # tsc --noEmit
npm run lint           # expo lint
npx expo-doctor        # dependency / config health
```

Typed routes (`experiments.typedRoutes`) are generated into `.expo/types` when the dev server runs. After adding a new route, start the dev server once so `typecheck` can validate `router.push(...)` hrefs.

## Builds and release

| Profile | Use | Output |
| --- | --- | --- |
| `development` | Day-to-day work with the dev client | APK |
| `preview` | Install on a phone for testing | APK |
| `production` | Google Play | AAB (version code auto-incremented) |

```bash
npx eas-cli@latest build --profile production --platform android
npx eas-cli@latest submit --platform android      # internal testing track
```

## Conventions

- **Install packages with `npx expo install <pkg>`** so versions match the Expo SDK.
- Routes live in **root `app/`**. Never create `src/app/`, because Expo Router would use it instead of `app/`.
- Stay on **Expo SDK 54** unless an upgrade is deliberately planned. Use the SDK 54 docs: <https://docs.expo.dev/versions/v54.0.0/>.
- Import `Tabs` and `Stack` from `expo-router`, and `ThemeProvider`/`DarkTheme` from `@react-navigation/native`.
- Synced data goes through a repository (`defineSyncableRepository`). Never call Firestore directly for user data. See [ARCHITECTURE.md](ARCHITECTURE.md).
- Never edit a shipped migration. Add a new one.
- UI components take data through props. They don't fetch it.
- Content that should be configurable (categories, sources, schedules) belongs in Firestore or SQLite, not in constants.
- Use the colour tokens from `useTheme()`. Don't hardcode colours.
