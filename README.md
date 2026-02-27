# Pranav Kowadkar — Portfolio

> **An interactive portfolio designed as a fully functional operating system experience.** Desktop visitors get a macOS-inspired environment; mobile visitors get an iOS springboard. Both share the same underlying data and AI backbone.

**Live:** [www.pkowadkar.com](https://www.pkowadkar.com)

---

## Screenshots

### Desktop — macOS Experience

![Desktop Home](https://files.manuscdn.com/user_upload_by_module/session_file/115134064/quaFucIFqSRXPDJA.png)

*The macOS-style desktop with menu bar, draggable windows, animated wallpaper, and an auto-hiding dock.*

### Mobile — iOS Springboard Experience

![Mobile Springboard](https://files.manuscdn.com/user_upload_by_module/session_file/115134064/gEwxrCwpbJzDtvgn.png)

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
| **Boot Intro** | Click-to-enter gate with `pk` monogram, boot sound (user-gesture triggered), and dissolve animation |
| **macOS Menu Bar** | Live clock, wallpaper switcher, notification ticker for achievements |
| **Draggable Windows** | All apps open as resizable, draggable macOS-style windows via `react-rnd` |
| **Auto-hiding Dock** | Magnification effect on hover, opens apps on click |
| **Animated Wallpaper** | Cinematic dark red/maroon fluid wallpaper, switchable via menu bar |
| **Haiku Easter Egg** | Konami code or triple-click triggers AI-generated haiku poetry |

### Mobile Shell

| Feature | Description |
|---|---|
| **iOS Intro** | Short `pk` flash (~1.5s) then springboard |
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
| **Pai** | AI assistant powered by Gemini + RAG backend. Knows Pranav's full background, projects, and story. Suggested question chips on first open. |
| **Projects** | Interactive project browser with tech stack badges, GitHub links, and live demo links |
| **My Story** | Chapter-based visual timeline of Pranav's journey from Mumbai to NYC |
| **Resume / CV** | Inline resume viewer with PDF download |
| **Terminal** | Easter egg terminal with `help`, `whoami`, `projects`, `contact`, and `secret` commands |
| **Contact** | iOS Contacts-style card with email, LinkedIn, GitHub, and Telegram links |
| **Haiku** | AI-generated haiku poetry with swipe gestures (mobile) or Konami code (desktop) |
| **CareerForge** | External link to [forge-your-future.com](https://forge-your-future.com) |

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
| **Google Gemini** | LLM for Pai's responses |
| **RAG pipeline** | Pranav's resume, projects, and story as context |
| **CORS** | Configured for `www.pkowadkar.com` and `pkowadkar.vercel.app` |

### Infrastructure

| Service | Purpose |
|---|---|
| **Vercel** | Frontend hosting and CDN |
| **Render** | Backend API hosting |
| **IONOS** | Domain registrar (`pkowadkar.com`) |
| **UptimeRobot** | Keep-alive pings to Render (prevents cold starts) |
| **GitHub** | Source control, triggers Vercel deploys on push |

---

## Project Structure

```
pkowadkar-portfolio/
├── client/
│   ├── public/
│   │   ├── manifest.json          # PWA manifest
│   │   └── favicon.svg
│   └── src/
│       ├── components/
│       │   ├── apps/              # Desktop app windows
│       │   │   ├── ChatPKApp.tsx  # Pai AI chat (desktop)
│       │   │   ├── ProjectsApp.tsx
│       │   │   ├── MyStoryApp.tsx
│       │   │   ├── CVApp.tsx
│       │   │   ├── TerminalApp.tsx
│       │   │   └── ContactApp.tsx
│       │   ├── mobile/            # iOS mobile shell
│       │   │   ├── MobileShell.tsx
│       │   │   ├── MobileIntro.tsx
│       │   │   ├── LockScreen.tsx
│       │   │   ├── NotificationCenter.tsx
│       │   │   └── apps/          # Mobile app screens
│       │   │       ├── MobilePai.tsx
│       │   │       ├── MobileProjects.tsx
│       │   │       ├── MobileMyStory.tsx
│       │   │       ├── MobileResume.tsx
│       │   │       ├── MobileTerminal.tsx
│       │   │       ├── MobileContact.tsx
│       │   │       └── MobileHaiku.tsx
│       │   ├── Desktop.tsx        # macOS desktop shell
│       │   ├── MenuBar.tsx        # macOS menu bar
│       │   ├── Dock.tsx           # macOS dock
│       │   ├── IntroScreen.tsx    # Boot animation
│       │   └── HaikuEasterEgg.tsx
│       ├── data/
│       │   └── projects.ts        # Shared project data
│       ├── hooks/
│       │   └── useMobile.tsx      # Device detection hook
│       └── App.tsx                # Root: device detection + routing
├── backend/                       # Python FastAPI RAG backend
│   └── main.py
└── README.md
```

---

## Local Development

### Prerequisites

- Node.js 22+
- pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/p-kowadkar/pkowadkar-portfolio.git
cd pkowadkar-portfolio

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The app will be available at `http://localhost:3000`.

### Environment Variables

Create a `.env` file in the project root:

```env
# Backend API URL (Render service)
VITE_API_URL=https://pkowadkar-portfolio.onrender.com

# Gemini API key (direct fallback if backend is offline)
VITE_GEMINI_API_KEY=your_gemini_api_key_here
```

### Backend (Python)

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

Built with [React](https://react.dev), [Vite](https://vitejs.dev), [Tailwind CSS](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com), [Framer Motion](https://www.framer.com/motion/), and [Google Gemini](https://ai.google.dev). Hosted on [Vercel](https://vercel.com) and [Render](https://render.com).

---

*© 2025 Pranav Kowadkar. All rights reserved.*
