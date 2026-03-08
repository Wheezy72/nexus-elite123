# Self-Hosting Guide — Nexus Elite

This guide walks you through fully self-hosting Nexus Elite with your own Supabase project (free tier works).

---

## Step 1: Create Your Own Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, pick a name and password, choose a region close to you
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **Project ID** (the `abcdefgh` part of the URL)

## Step 2: Create the Database Tables

1. In your Supabase dashboard, go to **SQL Editor**
2. Paste and run the contents of each file in `supabase/migrations/` (in order)
   - This creates all tables (profiles, tasks, habits, journal, mood, sleep, water, notes, goals, reminders) with RLS policies

Or run them via CLI:
```bash
# Install Supabase CLI
npm install -g supabase
supabase init
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

## Step 3: Enable Authentication

1. In Supabase dashboard → **Authentication → Providers**
2. Enable **Email** (already on by default)
3. For Google sign-in: Enable **Google** provider and add your OAuth credentials

## Step 4: Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

---

## Option A: Run Locally

```bash
npm install
npm run dev
# Open http://localhost:8080
```

## Option B: Build & Serve Static Files

```bash
npm run build
npx serve dist
# Or use any static server
```

## Option C: Docker (Recommended for VPS)

```bash
# Create .env with your Supabase credentials (see Step 4)

# Build and run with Docker Compose:
docker-compose up -d --build

# Your app is now at http://your-server-ip
```

Or build manually:
```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://YOUR_ID.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \
  --build-arg VITE_SUPABASE_PROJECT_ID=YOUR_ID \
  -t nexus-elite .

docker run -d -p 80:80 nexus-elite
```

---

## Option D: Free Hosting (No Server Needed)

| Platform | How |
|----------|-----|
| **Vercel** | Connect GitHub repo → auto-deploys. Add env vars in dashboard. |
| **Netlify** | Same as Vercel. Drag-drop `dist/` or connect repo. |
| **Cloudflare Pages** | Connect repo → builds automatically. Free tier is generous. |
| **Railway** | Use the Dockerfile. Free tier available. |

---

## Accessing on Your Phone

Once deployed (any method above), visit the URL on your phone:
- **Android**: Browser menu → "Install app"
- **iPhone**: Share → "Add to Home Screen"

The PWA will install as a full-screen native-feeling app.

---

## Cost Breakdown

| Component | Free Tier |
|-----------|-----------|
| Supabase | 500MB DB, 1GB storage, 50k auth users |
| Vercel/Netlify | 100GB bandwidth/month |
| Cloudflare Pages | Unlimited bandwidth |
| **Total** | **$0/month** for personal use |
