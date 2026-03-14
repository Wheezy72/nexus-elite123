# Deployment (no Docker)

This repo can be deployed as a **single Node web service**:
- `vite build` produces the frontend in `dist/`
- the backend serves `dist/` and exposes `/api/*`

That means you only deploy **one service**.

## Recommended: Render (GitHub Student Pack-friendly)

### 1) Create a new Render Web Service
- Connect your GitHub repo
- Choose branch: `main`

### 2) Build + start commands
- **Build command**:
  ```bash
  npm install && npm run build:prod
  ```
- **Start command**:
  ```bash
  npm run start:prod
  ```

### 3) Environment variables
Add these (as secrets where appropriate):

Frontend/Supabase:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PROJECT_ID`

Backend AI (optional):
- `AI_PROVIDER` (`mock` | `openai` | `gemini`)
- `OPENAI_API_KEY` + `OPENAI_MODEL` (if `openai`)
- `GEMINI_API_KEY` + `GEMINI_MODEL` (if `gemini`)

Hardening (recommended):
- `NODE_ENV=production`
- `CORS_ORIGIN=https://YOUR_RENDER_DOMAIN.onrender.com` (or your custom domain)

### 4) Deploy
Render will build and deploy automatically.

## PWA install (phone + laptop)

Once deployed on HTTPS:
- **Android**: Chrome → “Install app”
- **iPhone**: Safari → Share → “Add to Home Screen”
- **Laptop**: Chrome/Edge → install icon in address bar

Notes:
- PWA install requires HTTPS (Render/custom domain provides this).
- The app still uses Supabase for sync/auth, so it needs internet for cloud features.

## Security checklist

- Keep AI keys only in server env vars (never `VITE_*`).
- Ensure Supabase RLS policies are enabled (migrations handle tables; storage policies are in migrations too).
- Set `CORS_ORIGIN` in production.
- Rotate leaked keys immediately.
- Use GitHub Actions CI (included in `.github/workflows/ci.yml`).
