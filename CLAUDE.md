# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Meetiva is an AI-powered meeting intelligence platform that converts conversations into summaries, action items, and tracked tasks. The architecture is a monorepo with three npm workspaces (shared, frontend, admin) plus a standalone backend.

## Architecture

**Not a standard monorepo** — `backend/` is outside the npm workspaces array and maintains its own `package.json` and `package-lock.json`.

```
root/             workspace root (npm 11 format lockfile)
  shared/         @meetiva/shared-types — pure TypeScript types, must build first
  frontend/       React 19 + Vite SPA (port 5173) — main user app
  admin/          React 19 + Vite SPA (port 5174) — admin panel
  backend/        Express API (port 8000) — separate install, outside workspaces
```

### Key Constraints

1. **Build order matters:** `shared/` must be built (`npm run build`) before frontend/backend can import `@meetiva/shared-types`.
2. **Backend is standalone:** Run `cd backend && npm install` separately. It's not in the root `workspaces` array.
3. **Node 22+, npm 11 required:** Lockfiles are npm-11 format. CI runs Node 24.

## Essential Commands

**Setup (first time):**
```bash
npm ci                          # installs shared, frontend, admin
cd backend && npm ci            # backend is separate
cd shared && npm run build      # REQUIRED before frontend/backend work
```

**Development:**
```bash
npm run dev                     # concurrent: frontend + backend + admin
npm run dev:frontend            # frontend only (port 5173)
npm run dev:backend             # backend only (port 8000)
npm run dev:admin               # admin only (port 5174)
```

**Building:**
```bash
npm run build                   # builds shared → frontend → backend in order
npm run build:shared            # cd shared && npm run build
npm run build:frontend          # cd frontend && npm run build (tsc + vite)
npm run build:backend           # cd backend && npm run build (tsc)
```

**Type checking (run before every commit):**
```bash
cd frontend && npm run type-check   # tsc --noEmit
cd backend && npx tsc --noEmit      # no npm script for this
cd shared && npm run type-check     # tsc --noEmit
```

**Linting:**
```bash
cd frontend && npm run lint         # ESLint, max 15 warnings allowed
# Backend has no linter configured
```

**Testing:**
```bash
cd frontend && npm test             # Jest with ts-jest + jsdom
cd frontend && npm run test:watch
cd frontend && npm run test:coverage
# Backend tests are ad-hoc scripts: tsx src/tests/<file>.ts
```

**Database:**
```bash
cd backend && npm run db:seed                       # seed test data
cd backend && npm run db:seed:admin                 # create admin user
cd backend && npm run db:migrate:pro-to-team        # migration script
```

**Production:**
```bash
npm run prod                    # build + start with PM2
npm run start                   # PM2 start (via ecosystem.config.cjs)
npm run start:web               # node backend/dist/index.js (for PaaS)
```

## Tech Stack

### Frontend (React 19 SPA)
- **React 19** + TypeScript (pinned via root `overrides` — do not upgrade)
- **Tailwind CSS v4** — CSS-first config in `src/index.css` via `@import "tailwindcss"` and `@theme inline` (no `tailwind.config.js`)
- **Vite** with `@tailwindcss/vite` plugin
- **Redux Toolkit** — global state: auth, UI, meetings, workspace
- **TanStack Query** — server state caching
- **React Router v6** — client-side routing
- **React Hook Form + Zod** — form validation
- **shadcn/ui** — Radix primitives in `src/components/ui/`
- **Axios** — HTTP client with httpOnly refresh cookies

### Backend (Node.js API)
- **Express 5** + TypeScript (not Express 4 — async error handling differs)
- **MongoDB + Mongoose** — required; schemas in `src/models/`
- **Redis + ioredis** — optional; falls back to in-memory rate limiting
- **JWT** — access token (in-memory on client) + httpOnly refresh cookie
- **Groq Whisper** → **Gemini 2.0 Flash** — transcription + analysis pipeline
- **LLM fallback chain:** Groq (default) → xAI/Grok → Cerebras

### Admin Panel
- **React 19** + TypeScript + Vite (port 5174)
- Separate UI for admin tasks — shares backend API

### Shared Package
- Pure TypeScript types exported from `shared/dist/index.d.ts`
- Referenced as `@meetiva/shared-types` in frontend and backend

## Path Aliases

| Alias | Resolves to | Used in |
|-------|-------------|---------|
| `@/*` | `./src/*` | frontend, backend |
| `@meetiva/shared-types` | `../shared/dist/index.d.ts` | frontend, backend |
| `@shared` | `../backend/src/lib/` | **frontend only** (cross-package reference) |
| `@shared/schemas` | `../backend/src/lib/schemas.ts` | **frontend only** (Zod schemas) |

**Critical:** The `@shared` alias lets frontend import backend utilities directly (`@shared/schemas`, `@shared/validation`) — a cross-workspace boundary bypass.

## Authentication Flow

- **httpOnly refresh token** in cookie (secure, not accessible to JS)
- **Access token** stored in-memory via `setAccessToken()` in `services/api.client.ts` (never in localStorage)
- On page load: `AuthInitializer` calls `POST /auth/refresh` to restore session from the httpOnly cookie
- Google Sign-In users without a password are redirected to `/dashboard/profile` to set one (`hasPassword: false`)

## Frontend Details

### State Management
- **Redux slices:** `authSlice`, `meetingSlice`, `uiSlice`, `workspaceSlice` in `src/store/slices/`
- Auth state: user object, access token (in-memory), `isAuthenticated`
- TanStack Query for server data caching (meetings, tasks, analytics)

### Routing
- `src/router.tsx` — lazy-loaded pages
- `ProtectedRoute` wrapper — redirects to `/login` if unauthenticated, to `/verify-email` if unverified
- `SubscriptionGate` — wraps PRO/TEAM features (analytics, teams admin)
- `MeetingLimitGate` — global listener for free-tier meeting limit; redirects to `/dashboard/upgrade`

### Styling
- **Tailwind v4 CSS-first config** — all theme customization in `src/index.css` via `@theme inline`
- No `tailwind.config.js` file
- shadcn/ui components use `class-variance-authority` (cva) for variants

### Vite Proxy
- `/api` requests proxy to `http://localhost:8000` in dev (see `vite.config.ts`)
- `VITE_API_BASE_URL=/api/v1` (relative) — required for cookie-based auth to work

## Backend Details

### API Structure
- All routes mounted at `/api/v1/*` (e.g., `/api/v1/meetings`, `/api/v1/auth`)
- Non-versioned aliases: `/auth/*` and `/calendar/*` for legacy support
- Health check: `GET /health`

### Directory Structure
```
src/
  index.ts              Express app entry point
  routes/               API route handlers (auth, meetings, actionItems, teams, etc.)
  services/             Business logic (whisperTranscriber, groqAnalyzer, llmRouter, googleCalendar)
  models/               Mongoose schemas (User, Meeting, ActionItem, Team, etc.)
  middleware/           auth, authorize, errorHandler
  lib/                  Shared utilities (env, jwt, errors, validation, schemas, email, redis)
  jobs/                 Background jobs (deadlineNotifier, refreshTokenCleanup)
  scripts/              DB seeds and migrations
  tests/                Ad-hoc test scripts (run with tsx)
```

### Environment Variables
**Required:**
- `MONGODB_URI` — MongoDB connection string (Atlas or local)
- `JWT_SECRET` — min 32 chars, unique per environment

**Optional (degrade gracefully):**
- `GROQ_API_KEY` — transcription via Groq Whisper (or `WHISPER_API_KEY`)
- `GROK_API_KEY` / `XAI_API_KEY` — fallback LLM
- `CEREBRAS_API_KEY` — secondary fallback
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — calendar integration + Google Sign-In
- `REDIS_URL` — shared rate limiting (falls back to in-memory per-instance)
- `SMTP_*`, `EMAIL_FROM` — transactional emails (falls back to console logging)
- `ADMIN_EMAIL` — self-upgrade to PRO/TEAM via Settings page

Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`.

### Background Jobs
- `deadlineNotifier` (daily) — checks for overdue action items, sends email alerts
- `refreshTokenCleanup` (daily) — removes expired refresh tokens
- Both run as intervals inside the Express process (one instance assumed)

### LLM Pipeline
- **Transcription:** `whisperTranscriber.ts` calls Groq Whisper API
- **Analysis:** `llmRouter.ts` → `groqAnalyzer.ts` → Gemini 2.0 Flash (summarization, action-item extraction, sentiment)
- **Fallback chain:** Groq → xAI/Grok → Cerebras (env-key based)

## Shared Zod Schemas

`backend/src/lib/schemas.ts` contains Zod schemas shared between frontend and backend:
- Backend imports: `import { ... } from '../lib/schemas'`
- Frontend imports: `import { ... } from '@shared/schemas'`

This allows frontend forms to validate with the same schemas as backend API validation.

## Testing

### Frontend
- **Jest** with `ts-jest` and `jsdom` environment
- Test files: `src/__tests__/*.test.{ts,tsx}`
- Setup: `src/__tests__/setup.ts`
- Commands: `npm test`, `npm run test:watch`, `npm run test:coverage`

### Backend
- Ad-hoc test scripts in `src/tests/` and `tests/`
- Run with `tsx <file>` (e.g., `npm run test:rate-limit`)
- Uses `mongodb-memory-server` for DB tests
- No unified test runner or `npm test` script

## Pre-Commit Checklist

Run these **before every commit** to catch errors:

```bash
# Frontend
cd frontend && npm run type-check && npm run lint

# Backend
cd backend && npx tsc --noEmit

# Shared
cd shared && npm run type-check
```

**Lint:** Errors must be fixed. Warnings are allowed (max 15).
**Type errors:** Fix before committing. Pre-existing type errors in legacy code (e.g., missing `accountType`/`organizationId` on `User`) are exceptions — note them in the commit message.

## Common Gotchas

1. **Forgot to build shared?** Error: `Cannot find module '@meetiva/shared-types'` → Run `cd shared && npm run build`.
2. **Backend env vars don't override?** `dotenv.config({ override: true })` is set — shell env vars are ignored; edit `.env` instead.
3. **Frontend can't import `@shared/schemas`?** The alias points into `backend/src/lib/` — it bypasses the workspace boundary; requires backend to be present.
4. **Cookies don't work in dev?** Check `VITE_API_BASE_URL=/api/v1` (relative, not `http://localhost:8000/api/v1`). The Vite proxy handles the forwarding.
5. **Background jobs run multiple times?** They run in-process — scaling to multiple instances without Redis + job locks causes duplication.
6. **Type errors after npm install?** React 19 is pinned via root `overrides`. If deps drift, run `npm ci` (clean install) in root and backend.
7. **Port 8000 already in use?** Run `cd backend && npm run kill-port` or `npm run dev:clean`.

## Deployment

The backend serves both the API (`/api/v1`) and the built frontend SPA (`frontend/dist`) on a single port. No separate frontend server is needed.

**Single-process deploy:**
```bash
npm ci && cd backend && npm ci && cd ..
npm run build                    # shared → frontend → backend
PORT=8000 node backend/dist/index.js
```

**Health check:** `GET /health`

**Platforms:**
- **Render** — `render.yaml` blueprint included (recommended)
- **Railway** — set build/start commands + env vars
- **VPS** — PM2 via `ecosystem.config.cjs` + Nginx reverse proxy

See `DEPLOYMENT.md` for full details.

## Code Style

### Frontend
- Prettier: single quotes, trailing commas (es5), 100 char width, 2-space indent
- ESLint: `no-explicit-any: warn`, `no-unused-vars: error` (prefix unused with `_`)
- Tailwind v4: all config in CSS, no JS config file

### Backend
- No Prettier or ESLint configured
- TypeScript strict mode enabled

## Adding shadcn/ui Components

```bash
cd frontend
npx shadcn@latest add <component-name>
```

Components install to `src/components/ui/`.

## Useful File Locations

- **Auth middleware:** `backend/src/middleware/auth.ts`
- **Shared types:** `shared/src/*.types.ts`
- **Zod schemas (shared):** `backend/src/lib/schemas.ts`
- **API client:** `frontend/src/services/api.client.ts`
- **Redux store setup:** `frontend/src/store/index.ts`
- **Router:** `frontend/src/router.tsx`
- **Express app:** `backend/src/index.ts`
- **LLM analysis:** `backend/src/services/groqAnalyzer.ts`, `backend/src/services/llmRouter.ts`
- **Transcription:** `backend/src/services/whisperTranscriber.ts`

## References

- **AGENTS.md** — detailed repo structure, commands, path aliases, pre-commit checks
- **DEPLOYMENT.md** — production deployment guide (Render, Railway, VPS)
- **README.md** — feature overview, tech stack, quick start
