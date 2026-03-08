# Self-Hosting Guide — Nexus Elite

Run Nexus Elite on your own machine and access it from your phone on the same Wi-Fi network.

---

## Step 1: Create Your Own Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, pick a name and password, choose a region close to you
3. Once created, go to **Settings → API** and copy:
   - **Project URL** (e.g., `https://abcdefgh.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **Project ID** (the `abcdefgh` part of the URL)

## Step 2: Create the Database Tables

In your Supabase dashboard, go to **SQL Editor** and paste/run the contents of each file in `supabase/migrations/` (in order).

Or use the CLI:
```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_ID
supabase db push
```

## Step 3: Enable Authentication

### Email/Password (default — already enabled)

No extra setup needed.

### Google Sign-In (optional)

1. **Google Cloud Console** → [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Go to **APIs & Services → OAuth consent screen**
   - Choose **External** user type
   - Fill in app name, support email
   - Add scopes: `email`, `profile`, `openid`
   - Add your email as a test user (while in testing mode)
4. Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth Client ID**
   - Application type: **Web application**
   - **Authorized redirect URIs**: add your Supabase callback URL:
     ```
     https://YOUR_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Copy the **Client ID** and **Client Secret**
5. **Supabase Dashboard → Authentication → Providers → Google**
   - Toggle Google **ON**
   - Paste your Client ID and Client Secret
   - Save

### Update the Code for Self-Hosted Google Auth

The app uses Lovable's managed OAuth by default. For self-hosting, update `src/pages/AuthPage.tsx`:

Replace the `handleGoogle` function:
```typescript
// BEFORE (Lovable managed — won't work self-hosted):
import { lovable } from '@/integrations/lovable/index';
const result = await lovable.auth.signInWithOAuth('google', { ... });

// AFTER (standard Supabase — works self-hosted):
import { supabase } from '@/integrations/supabase/client';
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: window.location.origin },
});
```

Or simply remove the Google button if you only want email/password.

## Step 4: Configure Environment

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key-here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

---

## Running with Docker (Localhost + Phone)

### Quick Start

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd <project-folder>

# 2. Create your .env file (see Step 4 above)

# 3. Build and run
docker-compose up -d --build

# 4. Open in browser
# http://localhost
```

### Access from Your Android Phone

Your phone and computer must be on the **same Wi-Fi network**.

1. Find your computer's local IP:
   - **Windows**: `ipconfig` → look for IPv4 (e.g., `192.168.1.100`)
   - **Mac**: `ifconfig | grep "inet "` or System Settings → Wi-Fi → Details
   - **Linux**: `hostname -I`

2. On your phone, open Chrome and go to:
   ```
   http://192.168.1.100
   ```
   (replace with your actual IP)

3. **Install as PWA**: Chrome menu (⋮) → "Add to Home Screen" or "Install app"

It'll appear as a full-screen app on your home screen! 🎉

### Stop / Restart

```bash
# Stop
docker-compose down

# Restart (after code changes)
docker-compose up -d --build

# View logs
docker-compose logs -f
```

### Or Build Manually (without Docker Compose)

```bash
docker build \
  --build-arg VITE_SUPABASE_URL=https://YOUR_ID.supabase.co \
  --build-arg VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key \
  --build-arg VITE_SUPABASE_PROJECT_ID=YOUR_ID \
  -t nexus-elite .

docker run -d -p 80:80 --name nexus-elite nexus-elite
```

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Supabase (free tier) | $0 — 500MB DB, 50k auth users |
| Docker on your PC | $0 |
| **Total** | **$0/month** |
