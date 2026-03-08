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
- ☁️ **Cloud Sync** — All data syncs across devices

## Local Development

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ (or [Bun](https://bun.sh/))
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
# Create a .env file in the project root:
cat > .env << EOF
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
EOF

# You can find these values in:
#   Lovable → Cloud tab → Settings
#   Or your Supabase project → Settings → API

# 4. Start the development server
npm run dev
# or: bun dev

# 5. Open http://localhost:8080 in your browser
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
