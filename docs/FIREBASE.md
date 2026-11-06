# Firebase setup

Elora uses Firebase for Authentication, Cloud Firestore, Cloud Storage, Cloud Functions and Cloud Messaging. These steps set up a new project from scratch.

## 1. Create the project

1. Go to <https://console.firebase.google.com>, then **Add project**. Analytics is optional.
2. Upgrade to the **Blaze** plan. Cloud Functions, Cloud Scheduler and outbound network requests (needed for RSS feeds) require it. Usage at personal scale normally stays within the free tier.

## 2. Enable the services

| Service | Console location | Setting |
| --- | --- | --- |
| Authentication | Build → Authentication → Sign-in method | Enable **Email/Password** |
| Firestore | Build → Firestore Database | Create in **production mode**, region e.g. `asia-south1` (Mumbai) |
| Storage | Build → Storage | Same region as Firestore |
| Functions | Enabled the first time you deploy | Same region (set in `EXPO_PUBLIC_FIREBASE_FUNCTIONS_REGION` and `firebase/functions/src/index.ts`) |

## 3. Register the apps

**Web app (used by the JS SDK in Expo):**
Go to Project settings → General → Your apps → **Add app → Web**, then copy the config values into `.env`:

```bash
cp .env.example .env
```

These values are not secret. Access is enforced by the security rules.

**Android app (needed for FCM push in Phase 4):**
Choose **Add app → Android** and use the same package name as `ELORA_ANDROID_PACKAGE` (default `com.elora.assistant`; choose your own before the first Play Store upload, because it can't be changed afterwards). Download `google-services.json` to the project root. It is gitignored. For EAS builds, upload it as a file environment variable:

```bash
npx eas-cli@latest env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret
```

## 4. Deploy rules, indexes and functions

```bash
npm install -g firebase-tools
firebase login
firebase use --add            # select your project; this updates .firebaserc
cd firebase/functions && npm install && cd ../..
firebase deploy --only firestore:rules,firestore:indexes,storage
firebase deploy --only functions
```

## 5. Make yourself an admin

Admin rights are granted by the existence of `adminUsers/{uid}`. No client can create this document; the rules deny it. To add one:

1. Sign up in the app once.
2. Copy your **User UID** from Authentication → Users.
3. In Firestore, create the collection `adminUsers` with a document whose ID is your UID. For example: `{ "role": "owner", "createdAt": <timestamp> }`.
4. Restart the app. **More → Admin control centre** appears.

Cloud Functions that perform admin work must call `assertAdmin(request.auth?.uid)` from `firebase/functions/src/admin/validate-admin-access.ts`.

## 6. Local emulators (optional)

```bash
firebase emulators:start
```

Ports are configured in `firebase.json`: Auth 9099, Firestore 8080, Functions 5001, Storage 9199, plus the Emulator UI.

## App Check

App Check is planned for Phase 7. The Firebase JS SDK in React Native has no built-in Play Integrity provider, so it will be added with `@react-native-firebase/app-check` in a development build. After that, enforcement is switched on in the console.
