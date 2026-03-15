# Self-Hosting Guide — Future

Run Future on your own machine and access it from your phone on the same Wi-Fi network. **Total cost: $0/month.**

---

## Step 1: Create a Free Supabase Project

1. Go to **[supabase.com](https://supabase.com)** → click **Start your project** → sign up with GitHub or email
2. Once logged in, click **New Project**
   - **Organization**: pick your personal org (created automatically)
   - **Name**: anything you like (e.g., `future`)
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
- `finance_transactions`, `finance_budgets`, `finance_categories`, `finance_savings_goals`, `finance_limits`

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
   - App name: `Future` (or whatever you like)
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
   - Name: `Future`
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

#### C. App configuration

No code changes are required.

- The app uses **Supabase OAuth directly** (`supabase.auth.signInWithOAuth`).
- If Google isn’t enabled in Supabase, the UI will hide the Google button and you can still use email/password.

---

## Step 4: Configure Environment Variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key-here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

Replace the values with what you copied in Step 1.

### (Optional) Enable real AI responses

The AI gateway runs in **mock mode** by default. To use a real provider, add one of these to the same root `.env` file (Docker Compose reads it automatically):

**OpenAI**
```env
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

**Gemini (Google AI Studio)**
```env
AI_PROVIDER=gemini
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash
```



### Encrypted profile photo + encrypted backups (Storage buckets)

To use the encrypted profile photo and encrypted backups features, create these Storage buckets in Supabase:
- `future-profile`
- `future-backups`

You can keep them **private** (recommended). The app stores only encrypted blobs in these buckets.

---

## Step 5: Run the app

You have two options:
- **Option A (recommended): Docker** (easiest to run as a LAN "app" on your phone)
- **Option B: No Docker** (build + run with Node only)

### Option A: Docker

#### Prerequisites

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

### Option B: No Docker (Windows-friendly)

This runs the backend and serves the built frontend from the same Node server.

1) Install dependencies:
```bash
npm install
```

2) Create env files:
```bash
copy .env.example .env
copy backend\.env.example backend\.env
```

3) Build + run:
```bash
npm run prod
```

Open:
- http://localhost:3001

To access on your phone (same Wi‑Fi):
- find your PC IP (Windows: `ipconfig` → IPv4 Address)
- open: `http://YOUR_IP:3001`

> Note: for "installable" PWA on phones, HTTPS is usually required. On LAN HTTP you can still use it in the browser.

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
