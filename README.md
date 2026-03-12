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
- 📊 **Stats** — XP, streaks, analytics
- 🎮 **Gamification** — Levels 1–50, XP, trophies, animations
- 🎨 **Customization** — Accent colors, video backgrounds, visual effects
- 🤖 **Nexus AI (beta)** — Local AI gateway (mock by default). Supports OpenAI/Gemini/Anthropic server-side
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

### Tests

```bash
npm run test
npm run type-check
npm run lint
```

## Self-hosting

See `SELF_HOSTING.md`.

## License

MIT
