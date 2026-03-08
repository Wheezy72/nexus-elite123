# Self-Hosting Guide — Nexus Elite

Run Nexus Elite on your own machine and access it from your phone on the same Wi-Fi network. **Total cost: $0/month.**

---

## Step 1: Create a Free Supabase Project

1. Go to **[supabase.com](https://supabase.com)** → click **Start your project** → sign up with GitHub or email
2. Once logged in, click **New Project**
   - **Organization**: pick your personal org (created automatically)
   - **Name**: anything you like (e.g., `nexus-elite`)
   - **Database Password**: generate a strong one and **save it somewhere** — you'll need it later
   - **Region**: pick the one closest to you
   - Click **Create new project** — takes ~2 minutes to spin up

3. Once ready, go to **Settings → API** (left sidebar → gear icon → API)
   - Copy **Project URL** — looks like `https://abcdefgh.supabase.co`
   - Copy **anon / public** key — starts with `eyJ...`
   - Your **Project ID** is the `abcdefgh` part of the URL

> 💡 Keep these 3 values handy — you'll paste them into your `.env` file.

---

## Step 2: Create the Database Tables

### Option A: SQL Editor (easiest)

1. In your Supabase dashboard, click **SQL Editor** (left sidebar)
2. Open each file inside your project's `supabase/migrations/` folder **in alphabetical order**
3. For each file:
   - Click **New query**
   - Paste the entire contents
   - Click **Run** (green play button)
   - You should see "Success" at the bottom

### Option B: Supabase CLI

```bash
# Install the CLI
npm install -g supabase

# Link to your project (uses the Project ID from Step 1)
supabase link --project-ref YOUR_PROJECT_ID

# Push all migrations
supabase db push
```

### Verify It Worked

Go to **Table Editor** (left sidebar) — you should see these tables:
- `profiles`, `tasks`, `habits`, `habit_logs`, `journal_entries`
- `mood_entries`, `sleep_entries`, `water_logs`, `notes`, `goals`, `reminders`

---

## Step 3: Enable Authentication

### Email/Password (already enabled by default)

Nothing to do — it works out of the box.

### Google Sign-In (optional)

#### A. Set up Google Cloud OAuth

1. Go to **[console.cloud.google.com](https://console.cloud.google.com)**
2. Create a new project (or select existing)
3. Go to **APIs & Services → OAuth consent screen**
   - User type: **External**
   - App name: `Nexus Elite` (or whatever you like)
   - Support email: your email
   - Click **Save and continue**
4. **Scopes** → click **Add or Remove Scopes** → add:
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
   - `openid`
   - Click **Save and continue**
5. **Test users** → add your email address → **Save and continue**
6. Go to **APIs & Services → Credentials**
   - Click **Create Credentials → OAuth client ID**
   - Application type: **Web application**
   - Name: `Nexus Elite`
   - **Authorized redirect URIs** → add:
     ```
     https://YOUR_SUPABASE_PROJECT_ID.supabase.co/auth/v1/callback
     ```
   - Click **Create**
   - Copy the **Client ID** and **Client Secret**

#### B. Configure Supabase

1. In Supabase dashboard → **Authentication → Providers**
2. Find **Google** → toggle it **ON**
3. Paste your **Client ID** and **Client Secret**
4. Click **Save**

#### C. Update the Code

The app uses Lovable's managed OAuth by default. For self-hosting, edit `src/pages/AuthPage.tsx`:

**Remove** this import:
```typescript
import { lovable } from '@/integrations/lovable/index';
```

**Replace** the `handleGoogle` function with:
```typescript
const handleGoogle = async () => {
  setLoading(true);
  try {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
  } catch (err: any) {
    toast.error(err.message || 'Google sign-in failed');
    setLoading(false);
  }
};
```

> 💡 **Or** just remove the Google button entirely if email/password is enough for you.

---

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-public-key-here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

Replace the values with what you copied in Step 1.

---

## Step 5: Run with Docker

### Prerequisites

- [Docker Desktop](https://docker.com/products/docker-desktop) installed (Windows, Mac, or Linux)
- That's it!

### Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO

# 2. Create .env file with your Supabase credentials (see Step 4)

# 3. Build and run (first time takes ~2 minutes)
docker-compose up -d --build

# 4. Open in your browser
#    http://localhost
```

### Access from Your Android Phone (same Wi-Fi)

1. **Find your computer's local IP address**:

   | OS | Command |
   |----|---------|
   | **Windows** | Open CMD → type `ipconfig` → find **IPv4 Address** (e.g., `192.168.1.100`) |
   | **Mac** | System Settings → Wi-Fi → Details → **IP Address** |
   | **Linux** | Terminal → `hostname -I` |

2. **On your phone**, open Chrome and go to:
   ```
   http://192.168.1.100
   ```
   (replace with your actual IP)

3. **Install as an app**:
   - Chrome menu (⋮) → **"Add to Home Screen"** or **"Install app"**
   - It'll appear as a full-screen native-feeling app! 🎉

### Managing Docker

```bash
# Stop the app
docker-compose down

# Restart after code changes
docker-compose up -d --build

# View live logs
docker-compose logs -f

# Check if running
docker-compose ps
```

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| **Can't access from phone** | Make sure both devices are on the same Wi-Fi. Check firewall isn't blocking port 80. |
| **"Invalid API key"** | Double-check your `.env` values match Supabase → Settings → API |
| **Tables don't exist** | Re-run the migration SQL files in order (Step 2) |
| **Google sign-in not working** | Verify the redirect URI matches exactly, and you updated the code (Step 3C) |
| **Docker build fails** | Make sure `.env` exists and Docker Desktop is running |

---

## Cost Breakdown

| Component | Cost |
|-----------|------|
| Supabase free tier | $0 — 500MB database, 1GB storage, 50K auth users |
| Docker on your computer | $0 |
| **Total** | **$0/month** |

---

## Security Notes

- All database tables use Row-Level Security (RLS) — users can only access their own data
- Passwords are checked against known leaked password databases (HIBP)
- Minimum password length: 8 characters
- All API calls use the Supabase anon key (safe to expose — RLS protects data)
- The `.env` file is git-ignored and never included in the Docker image
