# Nexus Elite — Personal Productivity Command Center

A full-stack productivity app built with React, TypeScript, Tailwind CSS, and Lovable Cloud.

## Features

- 🔐 **Authentication** — Email/password + Google sign-in
- 👤 **Profiles** — Custom display names & 20 selectable avatars
- ✅ **Task Board** — Kanban with priorities, subtasks, due dates
- 🎯 **Habit Tracker** — Daily habits with streak tracking
- 📝 **Journal** — Brain dump with mood tagging
- 😊 **Mood Tracker** — Log moods with triggers & analytics
- 😴 **Sleep Tracker** — Bedtime/wake, quality scores, charts
- 💧 **Water Tracker** — Daily hydration with elastic animations
- 📒 **Notes** — Rich notes with categories & search
- 🎯 **Goals** — Track progress on daily/weekly goals
- ⏰ **Reminders** — Scheduled with repeat (once/daily/weekly)
- 🔔 **Notifications** — In-app toasts + browser push
- ⏱️ **Flow Timer** — Pomodoro-style focus sessions
- 📊 **Stats** — XP, streaks, and analytics
- 🎮 **Gamification** — XP bar, rewards, achievements
- 🎨 **Customization** — Accent colors, video backgrounds, visual effects
- 🤖 **Nexus AI (beta)** — Local AI gateway (mocked by default) to keep API keys off the frontend
- ☁️ **Cloud Sync** — All data syncs across devices

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v20+ (or [Bun](https://bun.sh/))
- npm, yarn, or bun

### Getting Started

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd <project-folder>

# 2. Install dependencies
npm install
# or: bun install

# 3. Set up environment variables
# Copy the example env files and fill in your keys (the real .env files are gitignored):
cp .env.example .env
cp backend/.env.example backend/.env

# Then edit:
#   - .env (Supabase URL + anon key)
#   - backend/.env (optional: AI_PROVIDER + provider key)

# You can find Supabase values in:
#   Lovable → Cloud tab → Settings
#   Or your Supabase project → Settings → API

# 4. Start the development server
npm run dev
# or: bun dev

# 5. Open http://localhost:5173 in your browser
#    (AI gateway runs at http://localhost:3001)
```

### Build for Production

```bash
npm run build
# Output is in the `dist/` folder

# Preview the build locally:
npm run preview
```

### Self-Hosting

After building, deploy the `dist/` folder to any static hosting:

- **Vercel**: `npx vercel --prod`
- **Netlify**: Drag & drop `dist/` to Netlify
- **Nginx**: Point root to `dist/`, add SPA fallback:
  ```nginx
  location / {
    try_files $uri $uri/ /index.html;
  }
  ```
- **Docker**:
  ```dockerfile
  FROM nginx:alpine
  COPY dist/ /usr/share/nginx/html/
  COPY nginx.conf /etc/nginx/conf.d/default.conf
  EXPOSE 80
  ```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + Framer Motion |
| UI Components | shadcn/ui + Radix |
| Backend | Lovable Cloud (Supabase) |
| Auth | Supabase Auth + Google OAuth |
| Database | PostgreSQL |
| Hosting | Lovable / any static host |
| PWA | vite-plugin-pwa |

## License

MIT
