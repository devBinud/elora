# ELORA
## Personal Assistant & Intelligence Application
**Technical Project Documentation | Expo React Native + Firebase**

### 1. Project Overview

Elora is a personal digital assistant application designed to manage everyday activities, personal routines, important reminders, news updates, personal journals and productivity.

The application will be developed entirely using Expo React Native with TypeScript.

Firebase will be the primary and only backend infrastructure.

There will be no separate Node.js/Express backend, MySQL database or independently hosted API server.

Firebase will handle:

- User authentication.
- Cloud database.
- Data storage.
- Push notifications.
- Scheduled backend operations.
- News data management.
- Cloud synchronisation.
- File storage.
- Application configuration.

The application should follow a modular, scalable and Firebase-first architecture.

### 2. Technology Stack

**Mobile Application**
- Expo React Native
- TypeScript
- Expo Router

**Firebase Services**
- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Functions
- Firebase Cloud Messaging (FCM)
- Firebase Cloud Storage
- Firebase App Check
- Firebase Security Rules
- Firebase Analytics (optional)

**Local Application Storage**
- expo-sqlite
- AsyncStorage
- expo-secure-store

**State Management**
- Zustand

**Additional Libraries**
- Axios (only where external HTTP requests are required)
- date-fns
- React Hook Form
- Zod
- Lucide React Native
- NetInfo

**Build and Deployment**
- Expo EAS Build
- Expo Development Builds
- Google Play Store

Use Firebase's modular JavaScript SDK where compatible with Expo. Use React Native Firebase only where a native Firebase integration is specifically required.

### 3. Main Application Modules

#### A. Personal Assistant

This is the primary module.

The application should help me manage my daily schedule and personal activities.

Features:

- Morning wake-up alarm.
- Breakfast reminders.
- Lunch-time reminders.
- Dinner reminders.
- Water reminders.
- Exercise reminders.
- Walking reminders.
- Medicine reminders.
- Work schedule reminders.
- Sleep-time reminders.
- Custom reminders.
- Recurring reminders.
- One-time reminders.
- Daily agenda.
- Upcoming activities.
- Notification history.

Every reminder should be dynamically manageable through the application.

**Reminder Management:**

- Create reminders.
- Edit reminders.
- Delete reminders.
- Enable or disable reminders.
- Configure specific times.
- Configure recurring schedules.
- Set notification sounds.
- Set vibration preferences.
- Configure reminder priority.

Store reminder configurations in Cloud Firestore and synchronise them with the device.

For scheduled local notifications, maintain a local scheduling system so that reminders can work without internet.

**Important Android Alarm Requirement:**

The wake-up alarm must be implemented separately from ordinary push notifications.

Use native Android alarm capabilities through an Expo config plugin or custom native module where necessary.

Consider:
- Exact alarm permissions.
- Notification permissions.
- Alarm sound.
- Alarm dismissal.
- Device reboot recovery.
- Time-zone changes.
- Battery optimisation.
- Alarm rescheduling.

Do not rely on Firebase Cloud Messaging to wake the device at an exact time.

#### B. News Intelligence

A dedicated news section that collects relevant news from carefully selected and trusted news organisations.

The objective is to stay updated on important developments without receiving unnecessary or low-quality information.

**Initial News Categories:**

- Technology
- Artificial Intelligence
- World News
- Indian Politics
- International Politics
- Business and Economy
- Science and Research
- Startups
- Cybersecurity
- Space and Astronomy
- Health and Science
- Education
- Environment
- Important Developments

Categories must be dynamically manageable through Firestore.

**News Source Management:**

From the admin section, I should be able to:

- Add news sources.
- Remove news sources.
- Enable or disable sources.
- Add RSS feed URLs.
- Manage supported news API sources.
- Assign sources to categories.
- Configure source priority.
- Manage refresh preferences.

**News Feed Features:**

- Latest news.
- Category-wise news.
- Important developments.
- Featured articles.
- Search.
- Bookmark articles.
- Read-later section.
- Viewed article history.
- Duplicate article detection.
- Source attribution.
- Original article links.

Each article should contain:

- Headline.
- Short summary.
- Publisher.
- Publication date.
- Category.
- Original URL.
- Thumbnail, if available.

**Firebase News Architecture:**

Firebase Cloud Functions should handle scheduled news aggregation.

Suggested workflow:

1. Cloud Scheduler triggers a scheduled Cloud Function.
2. The function fetches articles from configured RSS feeds or authorised APIs.
3. Articles are processed and categorised.
4. Duplicate articles are identified.
5. Processed articles are saved to Cloud Firestore.
6. The Expo application retrieves and displays the latest news.

Important: Firebase is the backend infrastructure, not a news provider. External RSS feeds and authorised news APIs will still be required.

Do not scrape restricted websites or republish copyrighted articles. Display short summaries, publisher attribution and links to original articles.

#### C. Personal Journal & Writing

A private writing section for personal thoughts, experiences, ideas and blog drafts.

Features:

- Create journal entries.
- Edit entries.
- Delete entries.
- Autosave.
- Save drafts.
- Create personal blogs.
- Organise entries by category.
- Add custom tags.
- Search entries.
- Favourite entries.
- View writing history.
- Store creation and modification dates.
- Support long-form writing.

Suggested categories:

- Personal Journal
- Daily Thoughts
- Ideas
- Technology
- Business
- Learning
- Experiences
- Future Plans
- Blog Drafts
- Other

**Data Storage:**

Store journal entries in Cloud Firestore.

For offline writing, maintain local SQLite copies and synchronise changes with Firestore when connectivity returns.

Personal journal entries must have appropriate security rules so that only the authenticated owner can access them.

#### D. Tasks & Productivity

Features:

- Create tasks.
- Edit tasks.
- Delete tasks.
- Set deadlines.
- Configure reminders.
- Set priorities.
- Create task categories.
- Mark tasks completed.
- View pending tasks.
- View overdue tasks.
- View completed tasks.
- Maintain task history.

Priority levels:

- High
- Medium
- Low

Store task information in Cloud Firestore and maintain local copies for offline access.

### 4. Application Navigation

Use a five-section bottom navigation system.

**1. Home**

The main dashboard should display:

- Greeting.
- Current date and time.
- Next reminder.
- Today's schedule.
- Upcoming activities.
- Pending tasks.
- Important notifications.
- Latest selected news.
- Quick journal entry shortcut.

**2. Assistant**

- Alarms.
- Reminders.
- Daily routines.
- Daily schedule.
- Custom activities.

**3. News**

- Latest news.
- Categories.
- Important developments.
- Bookmarks.
- Search.
- News sources.

**4. Journal**

- Personal journal.
- Blog drafts.
- Ideas.
- Writing categories.
- Saved entries.

**5. More**

- Tasks.
- Saved articles.
- Notification history.
- Admin control centre.
- Application settings.

### 5. Admin Control Centre

The application must include its own admin interface.

I should be able to manage the application's content and configurations without modifying the source code.

**A. Reminder Management**

- Add reminders.
- Edit reminders.
- Delete reminders.
- Manage schedules.
- Configure recurring reminders.
- Enable or disable notifications.

**B. Routine Management**

- Morning routine.
- Meal schedules.
- Work schedules.
- Exercise schedules.
- Sleep schedules.
- Custom routines.

**C. News Management**

- Add news sources.
- Remove news sources.
- Manage RSS feeds.
- Manage API sources.
- Create news categories.
- Edit categories.
- Configure source priorities.
- Configure refresh intervals.

**D. Journal Management**

- Manage writing categories.
- Manage tags.
- Manage writing preferences.

**E. Task Management**

- Manage task categories.
- Manage priority levels.
- Configure default reminders.

**F. General Settings**

- Notification preferences.
- Theme settings.
- Language settings.
- Data synchronisation.
- Backup.
- Data export.
- Privacy settings.

The admin interface should be protected through Firebase Authentication and appropriate Firestore security rules.

### 6. Firebase Database Architecture

Use Cloud Firestore as the primary cloud database.

Suggested structure:

```text
firestore/
│
├── users/
│   └── {userId}/
│       │
│       ├── profile/
│       │   └── settings
│       │
│       ├── reminders/
│       │   └── {reminderId}
│       │
│       ├── routines/
│       │   └── {routineId}
│       │
│       ├── alarms/
│       │   └── {alarmId}
│       │
│       ├── tasks/
│       │   └── {taskId}
│       │
│       ├── journals/
│       │   └── {entryId}
│       │
│       ├── bookmarks/
│       │   └── {articleId}
│       │
│       ├── notificationHistory/
│       │   └── {notificationId}
│       │
│       └── devices/
│           └── {deviceId}
│
├── newsCategories/
│   └── {categoryId}
│
├── newsSources/
│   └── {sourceId}
│
├── newsArticles/
│   └── {articleId}
│
├── appConfig/
│   └── {configId}
│
└── adminUsers/
    └── {userId}
```

Use subcollections for user-specific data and global collections for shared news content.

**Important database rules:**

- Every user must have isolated personal data.
- User data must be accessible only to its owner.
- Admin permissions must be verified securely.
- Never trust client-side admin flags.
- Use Firestore Security Rules.
- Use server-side validation in Cloud Functions.
- Add appropriate indexes.
- Avoid unnecessary reads and writes.
- Use pagination for news feeds.
- Implement sensible document structures.

### 7. Firebase Cloud Functions

Cloud Functions should handle backend operations that should not run directly on the mobile device.

Recommended functions:

**News Functions**
- fetchNewsSources
- processNewsArticles
- removeDuplicateArticles
- categoriseNews
- scheduledNewsRefresh

**Notification Functions**
- sendImportantNewsNotification
- sendCustomPushNotification
- manageNotificationTriggers

**Data Functions**
- validateAdminAccess
- processUserData
- scheduledCleanup
- manageBackupOperations

Use Firebase Cloud Scheduler for recurring backend jobs where required.

Avoid putting unnecessary backend logic inside the Expo application.

### 8. Notification Architecture

Use two different notification systems for different purposes.

**A. Local Notifications**

Use expo-notifications for:

- Lunch reminders.
- Water reminders.
- Daily routines.
- Task reminders.
- Sleep reminders.
- Custom scheduled notifications.

These should be scheduled locally on the device and work without an internet connection.

**B. Firebase Push Notifications**

Use Firebase Cloud Messaging for:

- Important breaking news.
- Important technology updates.
- Backend-triggered notifications.
- News alerts.
- Cloud-generated notifications.

Store device FCM tokens in the user's devices collection.

Handle token refresh and invalid tokens properly.

**C. Wake-up Alarm**

Use a dedicated native Android alarm implementation.

Do not use ordinary push notifications for exact wake-up scheduling.

### 9. Local-First and Synchronisation Architecture

The application should remain useful without internet connectivity.

Use SQLite as the local database.

The following features must support offline operation:

- Alarms.
- Reminders.
- Daily routines.
- Tasks.
- Journal writing.
- Saved news articles.
- Previously downloaded news.

**Synchronisation workflow:**

1. User creates or updates information.
2. Save changes locally in SQLite immediately.
3. Add pending changes to a synchronisation queue.
4. Check network availability.
5. Synchronise pending changes with Firestore.
6. Update local synchronisation status.
7. Resolve conflicts using a clearly defined strategy.

Do not make the user wait for a Firebase response before saving journal entries or tasks locally.

### 10. Recommended Folder Structure

Use a feature-based architecture with Firebase services separated from application features.

```text
elora/
│
├── app/
│   ├── _layout.tsx
│   ├── index.tsx
│   │
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx
│   │   └── login.tsx
│   │
│   ├── (tabs)/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── assistant.tsx
│   │   ├── news.tsx
│   │   ├── journal.tsx
│   │   └── more.tsx
│   │
│   ├── assistant/
│   │   ├── alarms.tsx
│   │   ├── reminders.tsx
│   │   ├── routines.tsx
│   │   ├── daily-schedule.tsx
│   │   └── create-reminder.tsx
│   │
│   ├── news/
│   │   ├── article/[id].tsx
│   │   ├── category/[id].tsx
│   │   ├── bookmarks.tsx
│   │   └── search.tsx
│   │
│   ├── journal/
│   │   ├── create.tsx
│   │   ├── edit/[id].tsx
│   │   ├── entry/[id].tsx
│   │   └── categories.tsx
│   │
│   ├── tasks/
│   │   ├── index.tsx
│   │   ├── create.tsx
│   │   └── completed.tsx
│   │
│   ├── admin/
│   │   ├── index.tsx
│   │   ├── reminders.tsx
│   │   ├── routines.tsx
│   │   ├── news-sources.tsx
│   │   ├── news-categories.tsx
│   │   ├── journal-categories.tsx
│   │   └── settings.tsx
│   │
│   └── settings/
│       ├── index.tsx
│       ├── notifications.tsx
│       ├── privacy.tsx
│       ├── backup.tsx
│       └── about.tsx
│
├── src/
│   │
│   ├── components/
│   │   ├── common/
│   │   ├── cards/
│   │   ├── forms/
│   │   ├── layout/
│   │   └── navigation/
│   │
│   ├── features/
│   │   ├── assistant/
│   │   ├── reminders/
│   │   ├── alarms/
│   │   ├── routines/
│   │   ├── news/
│   │   ├── journal/
│   │   ├── tasks/
│   │   └── admin/
│   │
│   ├── firebase/
│   │   ├── config.ts
│   │   ├── auth.ts
│   │   ├── firestore.ts
│   │   ├── storage.ts
│   │   ├── messaging.ts
│   │   └── functions.ts
│   │
│   ├── database/
│   │   ├── index.ts
│   │   ├── sqlite.ts
│   │   ├── migrations/
│   │   ├── schemas/
│   │   └── repositories/
│   │
│   ├── services/
│   │   ├── notifications/
│   │   ├── synchronization/
│   │   ├── alarm/
│   │   ├── connectivity/
│   │   └── backup/
│   │
│   ├── store/
│   ├── hooks/
│   ├── constants/
│   ├── config/
│   ├── types/
│   ├── utils/
│   └── theme/
│
├── plugins/
│   └── alarm-plugin/
│
├── assets/
│   ├── images/
│   ├── icons/
│   ├── fonts/
│   └── sounds/
│
├── docs/
│   ├── ARCHITECTURE.md
│   ├── FIREBASE.md
│   ├── FIRESTORE_SCHEMA.md
│   ├── NOTIFICATIONS.md
│   ├── ALARM_IMPLEMENTATION.md
│   └── DEVELOPMENT.md
│
├── firebase/
│   ├── functions/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── news/
│   │   │   ├── notifications/
│   │   │   └── scheduled/
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── firestore.rules
│   ├── firestore.indexes.json
│   └── storage.rules
│
├── app.config.ts
├── eas.json
├── firebase.json
├── .firebaserc
├── tsconfig.json
├── package.json
└── README.md
```

### 11. UI/UX Direction

The design should be minimal, professional and distraction-free.

Design requirements:

- Black-and-white visual foundation.
- Clean typography.
- Proper spacing.
- Minimal animations.
- Consistent layouts.
- Simple navigation.
- Readable news cards.
- Comfortable journal editor.
- Clear reminder indicators.
- Easy-to-use admin controls.

Avoid making the application look like a complicated business dashboard.

It should feel like a personal assistant that I can use throughout the day.

### 12. Development Phases

Build the application incrementally.

**Phase 1: Foundation**
- Expo project setup.
- TypeScript.
- Expo Router.
- Firebase configuration.
- Firebase Authentication.
- Firestore integration.
- SQLite setup.
- Navigation and common components.

**Phase 2: Personal Assistant**
- Home dashboard.
- Reminder management.
- Local notifications.
- Native Android alarm.
- Routine management.
- Daily schedule.

**Phase 3: Admin Control Centre**
- Reminder administration.
- Routine administration.
- News source management.
- Category management.
- Application settings.

**Phase 4: News Intelligence**
- RSS integration.
- Cloud Functions.
- Scheduled news aggregation.
- Article categorisation.
- Duplicate detection.
- News feed.
- Bookmarks.
- Push notifications.

**Phase 5: Personal Journal**
- Journal editor.
- Autosave.
- Firestore synchronisation.
- Offline writing.
- Categories and tags.
- Search.

**Phase 6: Tasks & Productivity**
- Task management.
- Priorities.
- Deadlines.
- Task reminders.
- Completed task history.

**Phase 7: Finalisation**
- Firebase Security Rules.
- Offline testing.
- Notification testing.
- Alarm reliability testing.
- Synchronisation testing.
- Performance optimisation.
- EAS production build.

### 13. Development Rules

1. Use Expo React Native and TypeScript.
2. Firebase must be the only backend infrastructure.
3. Do not create a separate Express or MySQL backend.
4. Use Cloud Firestore as the primary cloud database.
5. Use Firebase Authentication for user authentication.
6. Use Firebase Cloud Functions for server-side operations.
7. Use Firebase Cloud Messaging for push notifications.
8. Use Firebase Cloud Storage for files where required.
9. Use SQLite for local-first functionality.
10. Keep the application modular and feature-based.
11. Keep UI components separate from business logic.
12. Do not hardcode configurable content.
13. Implement proper Firestore Security Rules.
14. Keep private user information protected.
15. Ensure reminders and journal writing work offline.
16. Avoid unnecessary packages.
17. Maintain clear documentation.
18. Test native Android functionality using development builds.

### 14. Final Vision

Elora should become my personal digital assistant and information centre.

It should help me:

- Wake up on time.
- Maintain a healthy daily routine.
- Remember important activities.
- Organise my work and personal tasks.
- Stay updated with trusted news.
- Follow technology, politics, business and world developments.
- Maintain a personal journal.
- Save ideas and write blogs.
- Manage everything through my own admin interface.

The architecture should also allow future additions such as:

- AI-powered personal assistant.
- Voice commands.
- Intelligent news summaries.
- Daily briefing.
- Personal knowledge management.
- Smart task suggestions.
- Automated workflows.

Build the foundation properly so that these features can be added later without redesigning the entire application.