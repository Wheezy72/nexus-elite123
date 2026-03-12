# Nexus Elite — Personal Productivity Command Center

A full-stack productivity app built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Authentication** — Email/password + Google sign-in
- 👤 **Profiles** — Display name, 20 avatars, optional encrypted profile photo
- ✅ **Task Board** — Kanban with priorities, subtasks, due dates
- 🎯 **Habit Tracker** — Daily habits with streak tracking
- 📝 **Journal** — Brain dump with mood tagging
- 😊 **Mood Tracker** — Log moods with triggers & analytics
- 😴 **Sleep Tracker** — Bedtime/wake, quality scores, charts
- 💧 **Water Tracker** — Daily hydration
- 📒 **Notes** — Rich notes with categories & search
- 🎯 **Goals** — Track progress on daily/weekly goals
- ⏰ **Reminders** — Scheduled with repeat (once/daily/weekly)
- ⏱️ **Flow Timer** — Pomodoro-style focus sessions
- 📊 **Stats** — Pomodoro + focus analytics
- 📵 **Nexus Focus (Android app)** — Notification listener + focus-mode blocking + distraction analytics (local-only)
- 📈 **Analytics** — Wellness patterns, trends, correlations (mood/sleep/exercise/tasks)
- 🎓 **Study Planner** — AI-generated study plans + one-click task creation
- 💸 **Finance** — Monthly budget + expense tracker
- 🏆 **Achievements** — Trophy cabinet + level progress
- 🎮 **Gamification** — Levels 1–50, XP, trophies, animations
- 🎨 **Customization** — Accent colors, video backgrounds, visual effects
- 🤖 **Nexus AI (beta)** — Local AI gateway (mock by default). Supports OpenAI/Gemini server-side
- 💾 **Encrypted Backups** — Optional encrypted backup + restore (chat + profile photo)
- ☁️ **Cloud Sync** — Supabase sync for plaintext wellness data (RLS-protected)

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- npm

### Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Environment variables
cp .env.example .env
cp backend/.env.example backend/.env

# 3. (Optional) Encrypted profile photos + encrypted backups
# Create these Supabase Storage buckets:
#   - nexus-profile
#   - nexus-backups

# 4. Start dev
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001/api/health
```

### Run “production mode” without Docker

This builds the frontend and then serves it from the backend Node server (single process).

```bash
npm run prod
# Opens: http://localhost:3001
```

### Tests

```bash
npm run test
npm run type-check
npm run lint
```

## Mobile (Android)

A separate Expo + native module lives in `mobile/`.

```bash
cd mobile
npm install
npm run android
```

See `mobile/README.md` for permissions and notes.

## Self-hosting / deployment

- Local/self-host: `SELF_HOSTING.md`
- Deploy to the internet (recommended for phone + laptop): `DEPLOYMENT.md`

## License

MIT
