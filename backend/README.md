# pk-portfolio-backend

FastAPI backend for the pk-portfolio.  
Handles contact form emails and **dynamic haiku generation** via Gemini RAG.  
Designed for **Render free tier** with **UptimeRobot** keep-alive.

---

## What it does

| Feature | Description |
|---|---|
| `GET /api/health` | UptimeRobot ping target — keeps Render awake |
| `POST /api/contact` | Receives contact form → sends email via Gmail SMTP |
| `GET /api/haiku` | Generates 10 fresh haikus per session using Gemini RAG over journey doc + resume + GitHub activity |
| `GET /api/haiku?refresh=true` | Force-regenerates haikus (bypasses 24h cache) |

### How dynamic haikus work
On each `/api/haiku` call (cached 24h):
1. Loads `backend/data/journey.txt` (Pranav's journey document, ~82K chars)
2. Loads `backend/data/resume.txt` (master resume, ~34K chars)
3. Fetches recent GitHub repos + commit activity via GitHub API
4. Sends all context to Gemini 2.0 Flash with a strict prompt
5. Returns 10 haikus, each encoding a real, specific, surprising fact
6. Falls back to hardcoded haikus if Gemini is unavailable

---

## Deploy on Render (free tier)

### Step 1 — Get your API keys

**Gemini API key:**
1. Go to [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Create a new key → copy it

**GitHub Personal Access Token (PAT):**
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens) → Generate new token (classic)
2. Scopes needed: `public_repo`, `read:user`
3. Copy the token

**Gmail App Password:**
1. Go to [myaccount.google.com/security](https://myaccount.google.com/security)
2. Enable 2-Step Verification → search "App passwords" → create one for "Mail"
3. Copy the 16-char password

### Step 2 — Deploy to Render
1. Go to [render.com](https://render.com) → New → Web Service
2. Connect your GitHub repo (`p-kowadkar/pkowadkar-portfolio`)
3. Set **Root Directory** to `backend`
4. Set **Runtime** to `Docker`
5. Set **Plan** to `Free`
6. Add these **Environment Variables** in the Render dashboard:

| Variable | Value |
|---|---|
| `GEMINI_API_KEY` | your Gemini API key |
| `GITHUB_PAT` | your GitHub PAT |
| `GITHUB_USERNAME` | `p-kowadkar` |
| `SMTP_USER` | your Gmail address |
| `SMTP_PASS` | the 16-char App Password |
| `RECIPIENT_EMAIL` | `pranav.kowadkar@gmail.com` |
| `ALLOWED_ORIGINS` | your Vercel domain (e.g. `https://pkowadkar.vercel.app`) |
| `HAIKU_CACHE_TTL` | `86400` (24 hours) |

7. Deploy → copy the service URL (e.g. `https://pk-portfolio-backend.onrender.com`)

### Step 3 — Update the frontend
In `client/.env.production` (create if it doesn't exist):
```
VITE_API_URL=https://pk-portfolio-backend.onrender.com
```
Or set `VITE_API_URL` as an environment variable in your Vercel dashboard.

---

## Keep Render awake with UptimeRobot

Render free tier sleeps after 15 minutes of inactivity. UptimeRobot pings it every 5 minutes for free.

1. Go to [uptimerobot.com](https://uptimerobot.com) → Sign up free
2. Add New Monitor:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: pk-portfolio-backend
   - **URL**: `https://pk-portfolio-backend.onrender.com/api/health`
   - **Monitoring Interval**: 5 minutes
3. Save — your backend will never sleep again

---

## Local development

```bash
cd backend
pip install -r requirements.txt

# Set env vars
export GEMINI_API_KEY=your_key
export GITHUB_PAT=your_pat
export SMTP_USER=your@gmail.com
export SMTP_PASS=your_app_password

uvicorn main:app --reload --port 8000
```

Test haiku generation:
```bash
curl http://localhost:8000/api/haiku | python3 -m json.tool
```

Force regenerate (bypass cache):
```bash
curl "http://localhost:8000/api/haiku?refresh=true" | python3 -m json.tool
```

Test contact form:
```bash
curl -X POST http://localhost:8000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","subject":"Hello","message":"Testing!"}'
```
