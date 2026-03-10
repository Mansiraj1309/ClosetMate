# ClosetMate — Project Documentation

> A complete chronological record of the development journey, from concept to a fully-featured AI wardrobe app.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Phase 1: Foundation & Setup](#phase-1-foundation--setup)
4. [Phase 2: Building the Virtual Wardrobe](#phase-2-building-the-virtual-wardrobe)
5. [Phase 3: The AI Stylist Integration](#phase-3-the-ai-stylist-integration)
6. [Phase 4: Polish & Launch](#phase-4-polish--launch)
7. [Phase 5: Enhanced Features](#phase-5-enhanced-features)
8. [Phase 6: Authentication & Login](#phase-6-authentication--login)
9. [Issues & Bugs Resolved](#issues--bugs-resolved)
10. [Current Feature Summary](#current-feature-summary)
11. [Architecture Overview](#architecture-overview)
12. [Environment Variables](#environment-variables)

---

## Project Overview

**ClosetMate** is a full-stack AI-powered virtual wardrobe and personal stylist application. Users can photograph and catalogue their clothing, then ask an AI engine (Google Gemini) for outfit recommendations tailored to specific occasions, festivals, or style preferences. The AI also suggests items to purchase — with links to real Indian e-commerce stores — to complete an outfit.

**Core Goals:**
- Let users digitize their wardrobe with images and tags.
- Provide AI-driven outfit suggestions from the user's actual clothes.
- Recommend what to buy (and where) when the wardrobe is missing a piece.
- Support multiple user accounts with separate private wardrobes.
- Deliver a premium, dark-mode glassmorphism UI on all devices.

---

## Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| Frontend | React + Vite | Interactive UI with hot-reload development |
| Styling | Vanilla CSS | Custom dark-mode design system with glassmorphism |
| Icons | Lucide React | Beautiful SVG icon set |
| Routing | React Router DOM | Client-side page navigation |
| Backend | Node.js + Express.js | REST API server |
| Database | MongoDB (Atlas) | Persistent storage for users and clothing items |
| Images | Cloudinary + Multer | Cloud image hosting with automatic CDN delivery |
| AI Engine | Google Gemini API | Outfit recommendations, shopping suggestions |
| Auth | JWT + bcryptjs | Secure authentication with hashed passwords |

---

## Phase 1: Foundation & Setup

**Date:** Mar 1, 2026  
**Goal:** Initialize the project workspace and create the boilerplate for both frontend and backend.

### What was built
- **Backend boilerplate** — Express server (`server.js`), MongoDB connection via Mongoose, environment variable loading via `dotenv`, CORS middleware.
- **Frontend boilerplate** — React app scaffolded with Vite, global CSS design system (`index.css`) with dark mode, glassmorphism cards, gradient text, and responsive grid.
- **Files created:**
  - `backend/server.js`, `backend/package.json`, `backend/.env`
  - `frontend/src/App.jsx`, `frontend/src/index.css`, `frontend/src/main.jsx`
- **Documentation:** `Requirements.md` generated to guide the developer through prerequisite installations.
- **Git:** Repository initialized.

---

## Phase 2: Building the Virtual Wardrobe

**Date:** Mar 1, 2026  
**Goal:** Let users add, view, and delete clothing items with image upload.

### What was built

**Backend:**
- `models/Item.js` — Mongoose schema for clothing items (imageUrl, cloudinaryId, category, color, season, formality, styleNotes).
- `config/cloudinary.js` — Cloudinary SDK + Multer storage engine for handling file uploads.
- `routes/wardrobe.js` — REST endpoints: `POST /api/wardrobe` (add item), `GET /api/wardrobe` (list all), `DELETE /api/wardrobe/:id` (remove item).
- Installed `multer`, `cloudinary`, `multer-storage-cloudinary`.

**Frontend:**
- `components/AddItemModal.jsx` — Modal form to upload an image and tag details (category, color, season, formality, notes).
- `pages/Wardrobe.jsx` — Gallery grid view of all saved items with delete functionality.
- CSS for both components.
- React Router integrated for `/wardrobe` navigation.

### User action required
- Cloudinary credentials (cloud name, API key, API secret) populated in `backend/.env`.

---

## Phase 3: The AI Stylist Integration

**Date:** Mar 1, 2026  
**Goal:** Connect Google Gemini AI to generate outfit recommendations from the user's wardrobe.

### What was built

**Backend:**
- `routes/stylist.js` — Endpoint `POST /api/stylist/recommend` that: fetches the user's wardrobe → constructs a detailed fashion-stylist prompt → sends it to Gemini → parses the JSON response → returns outfit items with AI rationale.
- Installed `@google/genai`.

**Frontend:**
- `pages/Stylist.jsx` — Chat-like UI where user types an occasion, sees a loading spinner, then receives rendered outfit cards with the AI's rationale.
- `pages/Stylist.css` — Styling for the input, rationale card, and outfit grid.
- Navigation updated with an "AI Stylist" link.

### User action required
- Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey) populated in `backend/.env`.

---

## Phase 4: Polish & Launch

**Date:** Mar 1–2, 2026  
**Goal:** Bug fixes, infrastructure, UI polish, and live Dashboard stats.

### Bug Fixes
- **Wardrobe.jsx crash** — The `X` icon was imported at the bottom of the file instead of the top, causing a runtime crash. Moved to the correct import block.
- **CSS lint warning** — Added standard `background-clip: text` alongside `-webkit-background-clip` for cross-browser compatibility.

### New Features
- `routes/stats.js` — New API endpoint `GET /api/stats` returning total items, total categories, and per-category breakdown.
- **Dashboard rewrite** — Fetches live stats from `/api/stats`, shows category pill tags, "Ask the Stylist" CTA button, and clickable ClosetMate logo.

### Infrastructure
- `.gitignore` — Excludes `node_modules/`, `.env`, build outputs, and IDE config from Git.
- Phase docs archived in `docs/phases/`.

### CSS Polish
- Secondary gradient button variant, category pill styling, loading state, `fadeIn`/`slideUp` keyframe animations, smooth page transitions.

---

## Phase 5: Enhanced Features

**Date:** Mar 2, 2026  
**Goal:** Profile menu, festival calendar, quick AI prompts, and AI shopping suggestions.

### Profile Dropdown Menu
- `components/ProfileMenu.jsx` — Clicking the avatar circle in the nav opens a glassmorphism dropdown with: My Profile, Settings, Share ClosetMate (uses Web Share API), Help & Support, and Log Out.

### Upcoming Festivals & Events
- Dashboard now shows the next 3 upcoming Indian festivals (Holi, Eid, Diwali, Christmas, etc.) with dates.
- Each festival has a **"Style Me"** button that deep-links to the AI Stylist page with the occasion pre-filled.

### Quick AI Prompt Chips
- Dashboard "Style Ideas" card with clickable chips: 🏠 Casual day at home, ☀️ Outdoor brunch, 💼 Office meeting, 🌹 Dinner date, 🎨 Holi festival, 🖤 Gothic night.
- Clicking any chip navigates to `/stylist?occasion=...` and auto-fills the input.

### AI Shopping Suggestions *(Major Feature)*
- Upgraded the Gemini prompt to return structured `shoppingSuggestions` when the wardrobe is incomplete.
- Each suggestion includes: item name, why it completes the look, where to buy it (Myntra, Ajio, Amazon India, Flipkart, Tata CLiQ) with real URLs, and estimated price in ₹ INR.
- `Stylist.jsx` updated to render shopping cards with store link pills and price estimates.

---

## Phase 6: Authentication & Login

**Date:** Mar 2–9, 2026  
**Goal:** Add user accounts so each person has their own private wardrobe.

### Backend Auth System
- `models/User.js` — User schema with bcrypt password hashing (`pre('save')` hook) and a `matchPassword()` instance method.
- `middleware/auth.js` — JWT verification middleware that extracts `userId` from the token and attaches it to `req.userId`.
- `routes/auth.js` — Three endpoints:
  - `POST /api/auth/register` — Create account, return JWT.
  - `POST /api/auth/login` — Validate credentials, return JWT.
  - `GET /api/auth/me` — Get current user info (protected).
- `JWT_SECRET` added to `.env`.

### Frontend Auth System
- `context/AuthContext.jsx` — Global React context managing `user`, `token`, `loading`, `login()`, `register()`, `logout()`.
- `pages/AuthPage.jsx` — Login/Signup page with tab switching, matching the dark glassmorphism theme.
- `pages/AuthPage.css` — Full styling for the auth page.

### Per-User Wardrobe Isolation
- `Item.js` — Added `userId` field (ObjectId reference to User).
- **All backend routes** (`wardrobe.js`, `stats.js`, `stylist.js`) now require the `auth` middleware and filter data by `userId`.
- **All frontend components** (`Wardrobe.jsx`, `AddItemModal.jsx`, `Stylist.jsx`, `App.jsx` Dashboard) now send the `Authorization: Bearer <token>` header with every API request.
- `ProfileMenu.jsx` — Updated to show real user name/initials and working logout.
- `App.jsx` — Route protection: unauthenticated users see the login page, authenticated users see the full app. Dashboard greets user by first name.

---

## Issues & Bugs Resolved

| # | Issue | Root Cause | Fix |
|---|---|---|---|
| 1 | Wardrobe page crashes on load | `X` icon import was at the bottom of `Wardrobe.jsx` instead of with other imports | Moved import to top of file |
| 2 | CSS lint warning: `background-clip` | Missing standard property alongside `-webkit-background-clip` | Added `background-clip: text` |
| 3 | Login page returns "Server Error" | MongoDB was not installed locally; `.env` pointed to `localhost` | Switched to MongoDB Atlas (cloud database) |
| 4 | `ECONNREFUSED` on MongoDB Atlas | User's ISP DNS couldn't resolve Atlas SRV records | Added `dns.setServers(['8.8.8.8', '8.8.4.4'])` in `server.js` to force Google DNS |
| 5 | All users share the same wardrobe | `Item` model had no `userId` field; routes had no auth | Added `userId` to schema, protected all routes with JWT auth middleware |
| 6 | AI Stylist fails with "Check API Key" | Google detected the Gemini API key was publicly exposed and likely restricted it | User needs to generate a new API key from Google AI Studio |
| 7 | `npm install` fails with peer dep errors | Dependency version conflicts | Used `--legacy-peer-deps` flag |
| 8 | `lsof` command not found | User tried a Linux command on Windows PowerShell | Not a code bug — OS mismatch |

---

## Current Feature Summary

| Feature | Description |
|---|---|
| 🔐 Authentication | Secure Signup/Login with JWT tokens and bcrypt password hashing |
| 👤 Profile Menu | Dropdown with profile, settings, share, help, and logout |
| 👗 Virtual Wardrobe | Upload clothing photos (stored on Cloudinary), tag with category, color, season, formality |
| 🗑️ Wardrobe Management | View all items in a gallery grid, delete items |
| 🤖 AI Stylist | Type any occasion and get AI outfit picks from your actual wardrobe |
| 🛍️ Shopping Suggestions | AI recommends what to buy, where (Myntra, Ajio, Amazon), and at what price (₹) |
| 📅 Festival Calendar | Dashboard shows upcoming Indian festivals with "Style Me" buttons |
| ⚡ Quick AI Prompts | Dashboard chips for instant outfit ideas (casual, office, date, gothic, etc.) |
| 📊 Live Stats | Dashboard shows real-time wardrobe count, categories, and breakdown |
| 🌙 Premium Dark UI | Glassmorphism, gradients, micro-animations, fully responsive |
| 🔒 Per-User Data | Each account has its own private wardrobe and AI suggestions |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER'S BROWSER                           │
│                     http://localhost:3000                        │
│                                                                 │
│   ┌───────────┐  ┌───────────┐  ┌──────────┐  ┌──────────┐    │
│   │ Auth Page │  │ Dashboard │  │ Wardrobe │  │ Stylist  │    │
│   └───────────┘  └─────┬─────┘  └────┬─────┘  └────┬─────┘    │
│                        │              │              │          │
│      fetch() with JWT Authorization header                     │
└────────────────────────┼──────────────┼──────────────┼──────────┘
                         │              │              │
                         ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────────┐
│                     EXPRESS.JS SERVER (port 5000)                 │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐             │
│  │ Auth Routes │  │ Wardrobe API │  │ Stylist API │             │
│  │ /api/auth   │  │ /api/wardrobe│  │ /api/stylist│             │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘             │
│         │                │                  │                    │
│    ┌────▼────┐     ┌─────▼─────┐     ┌─────▼──────┐             │
│    │ MongoDB │     │ MongoDB + │     │ MongoDB +  │             │
│    │ (Users) │     │Cloudinary │     │ Gemini API │             │
│    └─────────┘     └───────────┘     └────────────┘             │
└──────────────────────────────────────────────────────────────────┘
```

---

## Environment Variables

All secrets are stored in `backend/.env` (never committed to Git):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/closetmate
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
```

---

*Last updated: March 9, 2026*
