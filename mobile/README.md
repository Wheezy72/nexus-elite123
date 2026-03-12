# Nexus Elite Mobile (Expo)

This is an **optional** Android-focused companion app to support:
- M-Pesa SMS auto-import (requires `READ_SMS` permission)
- Offline-first capture of finance transactions
- Sync to Supabase when online

## Setup

1. Create `mobile/.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

2. Install deps:

```bash
cd mobile
npm install
```

3. Run:

```bash
npm run android
```

> Notes
> - SMS reading is Android-only.
> - `react-native-get-sms-android` requires a development build (`expo run:android`). It will not work in Expo Go.

## What it does

- Reads SMS inbox (M-Pesa) and parses transactions client-side.
- Lets you approve/correct category before importing.
- Saves transactions locally when offline; syncs later.

The web app already supports “paste SMS” import without any permissions.
