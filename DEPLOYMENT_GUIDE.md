# 🚀 JT29 HUB — Deployment Guide (GitHub + Railway + Vercel)

## Architecture Overview

```
[User Browser]
      │  HTTPS
      ▼
[Vercel]  ← Next.js Frontend (Free)
      │  Proxy /api/* →
      ▼
[Railway] ← FastAPI Backend (Free tier)
      │
      ▼
[SQLite DB]  (persists on Railway volume)
```

---

## Step 1 — Push to GitHub

### 1.1 Create GitHub Repository
1. Go to https://github.com/new
2. Repository name: `jt29-hub` (or anything you like)
3. Set to **Private** (recommended — contains your shop logic)
4. Click **Create repository**

### 1.2 Initialize Git & Push

Open a terminal in your `JT29 HUB` folder:

```bash
cd "JT29 HUB"

# Initialize git
git init

# Add all files (.gitignore will auto-exclude venv, .db, node_modules)
git add .

# First commit
git commit -m "feat: initial commit — JT29 HUB"

# Connect to GitHub (replace YOUR_USERNAME with your GitHub username)
git remote add origin https://github.com/YOUR_USERNAME/jt29-hub.git

# Push
git branch -M main
git push -u origin main
```

✅ Your code is now on GitHub. Check that these folders are NOT uploaded:
- `backend/venv/`
- `backend/data/*.db`
- `frontend/node_modules/`
- `frontend/.next/`

---

## Step 2 — Deploy Backend to Railway

Railway is the easiest free hosting for Python/FastAPI.

### 2.1 Sign Up & Connect GitHub
1. Go to https://railway.app
2. Sign up with your **GitHub account**

### 2.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Select your `jt29-hub` repository
4. Railway will detect the project — click **"Add service"** → **"GitHub Repo"**
5. When prompted for the root directory, set it to: **`backend`**

### 2.3 Set Environment Variables (IMPORTANT!)

In Railway dashboard → your service → **"Variables"** tab, add:

| Variable | Value |
|---|---|
| `JWT_SECRET_KEY` | (generate: `python -c "import secrets; print(secrets.token_hex(32))"`) |
| `TRUEMONEY_PHONE` | `0621466134` |
| `ALLOWED_ORIGINS` | `https://YOUR-APP.vercel.app` ← fill in after Vercel deploy |

### 2.4 Get Your Backend URL
After deploy succeeds, go to **"Settings"** → **"Domains"** → click **"Generate Domain"**

You'll get a URL like: `https://jt29-hub-production.up.railway.app`

**Save this URL — you'll need it for Vercel.**

### 2.5 Create Admin Account (First Time Only)

After backend is running, call these URLs in your browser:

```
# 1. Create the database tables (automatic on startup)

# 2. Register admin account via API
POST https://jt29-hub-production.up.railway.app/api/register
Body: {"username": "adminjustin", "password": "YOUR_SECURE_PASSWORD"}

# 3. (Optional) Seed demo products — requires admin login token
GET https://jt29-hub-production.up.railway.app/api/admin/seed
```

Or use the FastAPI docs at: `https://jt29-hub-production.up.railway.app/docs`

---

## Step 3 — Deploy Frontend to Vercel

### 3.1 Sign Up & Connect
1. Go to https://vercel.com
2. Sign up with your **GitHub account**

### 3.2 Import Project
1. Click **"Add New Project"**
2. Import your `jt29-hub` GitHub repo
3. Set **Root Directory** to: **`frontend`**
4. Framework: **Next.js** (auto-detected)

### 3.3 Set Environment Variables

In Vercel → Project → **"Settings"** → **"Environment Variables"**, add:

| Variable | Value |
|---|---|
| `BACKEND_URL` | `https://jt29-hub-production.up.railway.app` |

### 3.4 Deploy
Click **"Deploy"** — Vercel will build and give you a URL like:
`https://jt29-hub.vercel.app`

---

## Step 4 — Update CORS on Railway

Now that you have your Vercel URL, go back to Railway and update:

| Variable | Value |
|---|---|
| `ALLOWED_ORIGINS` | `https://jt29-hub.vercel.app` |

Railway will automatically restart the backend.

---

## Step 5 — Test Everything

Visit your Vercel URL and test:
- [ ] Register a new account
- [ ] Login
- [ ] View products (store page)
- [ ] Login as admin and check admin panel
- [ ] Test TrueMoney topup with `TEST-50` (mock mode)

---

## 🔑 Making Yourself Admin

After registering, use the Railway backend API to set your account as admin.
Open the FastAPI docs: `https://YOUR-BACKEND.railway.app/docs`

Or via the admin seed endpoint (requires admin token — only after first admin is created manually via SQL).

For first-time setup, you can temporarily use the Railway **database console** to run:

```sql
UPDATE users SET is_admin = 1 WHERE username = 'adminjustin';
```

---

## 🔄 Updating Code

After making changes:

```bash
git add .
git commit -m "fix: your change description"
git push
```

Both Railway and Vercel will **auto-redeploy** when you push to GitHub. ✨

---

## ⚠️ Important Notes

1. **SQLite on Railway** — Data persists between deploys as long as you use Railway's persistent storage. Do NOT use free-tier plans that sleep and reset storage.

2. **Free Tier Limits**:
   - Railway free: $5 credit/month (enough for light traffic)
   - Vercel free: 100GB bandwidth/month (generous)

3. **Custom Domain** — Both Railway and Vercel support custom domains on free plans.

4. **Database Backup** — Periodically download `jt29_database.db` from Railway's volume for backup.

---

## 📁 Final Project Structure (on GitHub)

```
jt29-hub/
├── .gitignore              ← root gitignore
├── DEPLOYMENT_GUIDE.md     ← this file
├── backend/
│   ├── .gitignore
│   ├── .env.example        ← template (never commit .env)
│   ├── requirements.txt    ← Python dependencies
│   ├── Procfile            ← Railway startup command
│   ├── railway.json        ← Railway config
│   ├── main.py             ← FastAPI app
│   ├── auth.py             ← JWT authentication
│   └── database.py         ← SQLAlchemy models
└── frontend/
    ├── .env.example        ← template (never commit .env.local)
    ├── package.json
    ├── next.config.ts      ← API proxy config
    └── src/
        └── app/            ← Next.js pages
```
