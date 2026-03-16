# Future Mobile (Android)

Android companion app for Future.

Features:

- **Health Connect sync** → uploads daily aggregates (steps/sleep/HR) to Supabase (`health_daily_metrics`)
- **Future Focus** → notification listener + focus-mode blocking + local distraction logging

## Requirements

- Node.js 20+
- Android Studio + SDK
- A physical Android device recommended

## Environment

Create `mobile/.env`:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

## Install

```bash
cd mobile
npm install
```

## Run (development build)

This app uses native modules (Focus + Health Connect), so it cannot run in Expo Go.

```bash
cd mobile
npm run prebuild
npm run android
```

## Permissions

The app requests:

- Health Connect read permissions (steps/sleep/heart rate)
- Notification access + Do Not Disturb access (for Focus)

## Data & privacy

- Health sync uploads **daily aggregates only** (no raw samples) to your Supabase account.
- Focus logs are stored **locally only**.
