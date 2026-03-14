# Nexus Elite Mobile (Android)

This is an **Android-only** companion app that adds capabilities the web app cannot do on mobile browsers:

- Notification Listener (captures metadata + timestamps)
- Focus Mode (suppresses distractions + logs "blocked" events)
- Local-only distraction analytics
- Optional scheduled auto-focus (weekdays)

> iOS cannot read other apps' notifications due to Apple restrictions.

## Requirements

- Node.js 20+
- Android Studio + SDK
- A physical Android device recommended (Notification Access + DND Access are easier to validate)

## Install

```bash
cd mobile
npm install
```

## Run (development build)

Because this app includes custom native code (notification listener), it **cannot** run inside Expo Go.

```bash
cd mobile
npm run android
```

This runs `expo run:android`, which creates a native development build including the `nexus-focus` native module.

## Permissions

The app will guide you to enable:

- **Notification access**: Settings → Notifications → Notification access → "Nexus Elite"
- **Do Not Disturb access**: Settings → Special app access → Do Not Disturb access → "Nexus Elite"

## Data & privacy

- Stored **locally only** in an on-device SQLite database owned by the app.
- Logs contain: package/app name, category, blocked/allowed, timestamp.
- Notification title/text are stored **only as SHA-256 hashes** (so the app can detect repeated patterns without saving message content).
- No server upload.

## Notes

- Android does not allow apps to "hold" notifications and re-deliver them later. Nexus logs blocked items and shows them in the in-app feed after focus ends.
