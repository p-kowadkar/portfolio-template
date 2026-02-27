# macOS Portfolio — Template / Skeleton

> **An interactive portfolio designed as a fully functional operating system experience.** Desktop visitors get a macOS-inspired environment; mobile visitors get an iOS springboard. Both share the same underlying data and AI backbone.

This is the **public template** of [Pranav Kowadkar's portfolio](https://www.pkowadkar.com). All personal data (resume, journey, profile images) has been replaced with clearly labeled placeholders so you can fork this and make it your own in ~30–45 minutes.

**Live demo:** [www.pkowadkar.com](https://www.pkowadkar.com)

---

## Screenshots

### Desktop — macOS Experience

![Desktop Home](assets/screenshot-desktop.png)

*The macOS-style desktop with menu bar, draggable windows, animated wallpaper, and an auto-hiding dock.*

### Mobile — iOS Springboard Experience

![Mobile Springboard](assets/screenshot-mobile.png)

*The iOS-style springboard with live status bar, app icon grid, frosted glass dock, and pull-down notification center.*

---

## Overview

This portfolio is not a traditional scrolling webpage. It is a **dual-mode interactive experience** that detects the visitor's device and renders an entirely different shell:

- **Desktop / Tablet (≥ 768px + no touch):** A macOS-inspired environment with a menu bar, draggable and resizable windows, an auto-hiding dock, animated wallpaper, and a boot sequence with audio.
- **Mobile (< 768px or touch device):** An iOS-style springboard with a live status bar, app icon grid, frosted glass bottom dock, swipe-down notification center, idle lock screen, and PWA support for "Add to Home Screen."

Both modes share the same AI assistant (Pai), project data, and narrative content.

---

## Features

### Desktop Shell

| Feature | Description |
|---|---|
| **Boot Intro** | Click-to-enter gate with `pk` monogram (edit for your initials), boot sound (user-gesture triggered), and dissolve animation |
| **macOS Menu Bar** | Live clock, wallpaper switcher, notification ticker for achievements |
| **Draggable Windows** | All apps open as resizable, draggable macOS-style windows via `react-rnd` |
| **Auto-hiding Dock** | Magnification effect on hover, opens apps on click |
| **Animated Wallpaper** | Cinematic dark red/maroon fluid wallpaper, switchable via menu bar |
| **Haiku Easter Egg** | Konami code or triple-click triggers AI-generated haiku poetry |

### Mobile Shell

| Feature | Description |
|---|---|
| **iOS Intro** | Short `pk` flash (edit for your initials) (~1.5s) then springboard |
| **Live Status Bar** | Real-time clock updates every 10 seconds |
| **Springboard Grid** | 3×3 app icon grid with labels and animated tap feedback |
| **Frosted Glass Dock** | 4 pinned apps in a bottom dock pill |
| **Pull-down Notification Center** | Swipe down from status bar to reveal 3 achievement notification cards |
| **Idle Lock Screen** | After 60 seconds of inactivity: blurred wallpaper, large clock, tap-to-unlock |
| **Swipe Hint** | Animated down-arrow fades after 4 seconds to teach new visitors |
| **PWA Support** | `manifest.json` + `apple-touch-icon` for "Add to Home Screen" on iPhone |

### Apps (available on both desktop and mobile)

| App | Description |
|---|---|
| **AI Guide (Pai)** | AI assistant powered by OpenRouter + RAG backend. Knows your full background, projects, and story via `journey.txt` + `resume.txt`. Suggested question chips on first open. Rename and reprompt in `ChatPKApp.tsx`. |
| **Digital Twin (Talk to PK)** | FaceTime-style video call UI with incoming call screen, voice input (Web Speech API), and ElevenLabs TTS. Speaks as you in first person using your cloned voice. Requires `VITE_ELEVENLABS_API_KEY` + `VITE_ELEVENLABS_VOICE_ID`. |
| **Projects** | Interactive project browser with tech stack badges, GitHub links, and live demo links. Data in `client/src/data/projects.ts`. |
| **My Story** | Chapter-based visual timeline. Replace chapter content in `MyStoryApp.tsx`. |
| **Resume / CV** | Inline resume viewer with PDF download. Replace the PDF in `client/public/data/` and update `CVApp.tsx`. |
| **Terminal** | Easter egg terminal with `help`, `whoami`, `projects`, `contact`, and `secret` commands. Update responses in `TerminalApp.tsx`. |
| **Contact** | iOS Contacts-style card. Update links in `ContactApp.tsx` or the equivalent mobile app. |
| **Haiku** | AI-generated haiku poetry with swipe gestures (mobile) or Konami code (desktop). |
| **Browser / External app** | External link app — point it at your own product/project URL. |

---

## Tech Stack

### Frontend

| Technology | Purpose |
|---|---|
| **React 19** | UI framework |
| **TypeScript** | Type safety |
| **Vite** | Build tool and dev server |
| **Tailwind CSS v4** | Utility-first styling |
| **shadcn/ui** | Accessible component primitives |
| **Framer Motion** | Animations and transitions |
| **react-rnd** | Draggable/resizable desktop windows |
| **Wouter** | Lightweight client-side routing |
| **Lucide React** | Icon library |

### Backend (separate Render service)

| Technology | Purpose |
|---|---|
| **Python / FastAPI** | REST API server |
| **OpenRouter** | Multi-model LLM fallback chain (Gemini, Claude, GPT-4.1, Qwen, Mistral) |
| **RAG pipeline** | Your resume + journey as context (`backend/data/`) |
| **CORS** | Update allowed origins via `ALLOWED_ORIGINS` env var to match your domain |

### Infrastructure

| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting and CDN |
| **Render** | Backend API hosting |
| **Your preferred registrar** | Domain registration (IONOS, Namecheap, Google Domains, etc.) |
| **UptimeRobot** | Keep-alive pings to Render (prevents cold starts) |
| **GitHub** | Source control, triggers Vercel deploys on push |

---

## Project Structure

```
portfolio-skeleton/
├── client/
│   ├── public/
│   │   ├── manifest.json              # PWA manifest
│   │   └── favicon.svg
│   └── src/
│       ├── components/
│       │   ├── apps/                  # Desktop app windows
│       │   │   ├── ChatPKApp.tsx      # Pai AI chat (desktop)
│       │   │   ├── VideoCallApp.tsx   # Digital Twin "Talk to PK" (desktop)
│       │   │   ├── ProjectsApp.tsx
│       │   │   ├── MyStoryApp.tsx
│       │   │   ├── CVApp.tsx
│       │   │   ├── TerminalApp.tsx
│       │   │   └── ContactApp.tsx
│       │   ├── mobile/                # iOS mobile shell
│       │   │   ├── MobileShell.tsx
│       │   │   ├── MobileIntro.tsx
│       │   │   ├── LockScreen.tsx
│       │   │   ├── NotificationCenter.tsx
│       │   │   └── apps/              # Mobile app screens
│       │   │       ├── MobilePai.tsx
│       │   │       ├── MobileDigitalTwin.tsx  # Digital Twin (mobile)
│       │   │       ├── MobileProjects.tsx
│       │   │       ├── MobileMyStory.tsx
│       │   │       ├── MobileResume.tsx
│       │   │       ├── MobileTerminal.tsx
│       │   │       ├── MobileContact.tsx
│       │   │       └── MobileHaiku.tsx
│       │   ├── Desktop.tsx            # macOS desktop shell
│       │   ├── MenuBar.tsx            # macOS menu bar
│       │   ├── Dock.tsx               # macOS dock
│       │   ├── IntroScreen.tsx        # Boot animation
│       │   └── HaikuEasterEgg.tsx
│       ├── data/
│       │   └── projects.ts            # Shared project data
│       ├── hooks/
│       │   └── useMobile.tsx          # Device detection hook
│       └── App.tsx                    # Root: device detection + routing
├── backend/                           # Python FastAPI RAG backend
│   ├── data/
│   │   ├── journey.txt                # Your story (replace this)
│   │   └── resume.txt                 # Your resume in plain text (replace this)
│   ├── main.py
│   ├── requirements.txt
│   ├── render.yaml
│   └── backend.env.example            # All required backend env vars
├── frontend.env.example               # All required frontend env vars
└── README.md
```

---

## Getting Started (fork this)

### Step 1 — Clone and install

```bash
git clone https://github.com/p-kowadkar/portfolio-skeleton.git
cd portfolio-skeleton
pnpm install
```

### Step 2 — Fill in your data (the only files you NEED to edit)

| File | What to do |
|---|---|
| `backend/data/journey.txt` | Replace with your story — written in first person, narrative style. This feeds the RAG backend. |
| `backend/data/resume.txt` | Paste your resume in plain text. Sections: SUMMARY, SKILLS, EXPERIENCE, PROJECTS, ACHIEVEMENTS. |
| `client/src/components/apps/ChatPKApp.tsx` | Update `FALLBACK_SYSTEM_PROMPT` — fill in the `[YOUR_NAME]` / `[AI_GUIDE_NAME]` placeholders with your details. |
| `client/src/data/projects.ts` | Replace with your own projects. |
| `client/src/data/experience.ts` | Replace with your own work history. |
| `client/src/components/apps/MyStoryApp.tsx` | Replace chapter content with your own narrative. |
| `client/public/data/` | Drop in your own images and resume PDF. Update references in `CVApp.tsx` and `experience.ts`. |

> **Backend env vars:** See `backend.env.example` for all required variables (OpenRouter key, SMTP credentials, GitHub PAT, etc.) — set these on Render under Environment.

### Step 3 — Configure frontend environment variables

Create a `.env` file in the project root:

```env
# Backend API URL (your Render service URL after deploying backend/)
VITE_API_URL=https://YOUR_BACKEND.onrender.com

# Digital Twin voice (optional — needed for "Talk to PK" feature)
# Get your key at https://elevenlabs.io → Profile → API Keys
VITE_ELEVENLABS_API_KEY=your_elevenlabs_api_key_here

# Your cloned ElevenLabs voice ID (leave blank to use a default male voice)
VITE_ELEVENLABS_VOICE_ID=your_voice_id_here
```

### Step 4 — Run locally

```bash
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Step 5 — Deploy

| Service | What to deploy | Notes |
|---|---|---|
| **Vercel** | Frontend (`client/`) | Connect your GitHub repo, auto-deploys on push |
| **Render** | Backend (`backend/`) | Uses `backend/render.yaml` for config; set all env vars from `backend.env.example` |
| **UptimeRobot** | Ping your Render URL every 5 min | Prevents Render free-tier cold starts |

### Backend (local)

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

---

## Design Philosophy

The portfolio is built around a single concept: **what if a portfolio felt like an operating system?** Rather than scrolling through sections, visitors explore apps. Rather than reading a bio, they talk to an AI. Rather than viewing a project list, they browse a window.

The visual language is deliberately cinematic — deep maroon and black, serif typography (*DM Serif Display*), monospace accents (*DM Mono*), and fluid animated wallpapers. The aesthetic references classic macOS and iOS design while maintaining a distinctly personal identity through the `pk` monogram and the red accent color.

---

## Easter Eggs

- **Konami Code** on desktop (↑↑↓↓←→←→BA) triggers the haiku viewer
- **Triple-click** anywhere on the desktop also triggers haiku
- **Terminal app** — type `secret` for a hidden message
- **Menu bar** — click the trophy icon in the notification ticker for achievement details
- **Mobile lock screen** — appears after 60 seconds of idle

---

## Acknowledgements

Built with [React](https://react.dev), [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Framer Motion](https://www.framer.com/motion/), and [OpenRouter](https://openrouter.ai). Hosted on [Vercel](https://vercel.com) and [Render](https://render.com).

---

*Original design & implementation by [Pranav Kowadkar](https://www.pkowadkar.com). Template released for public use — attribution appreciated but not required.*