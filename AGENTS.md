# AGENTS.md — Meetiva.ai

## Repo Structure

Three packages. **Not a standard npm workspace** — `backend/` is outside the root workspaces.

```
root/             workspace root (npm workspaces: shared, frontend)
  shared/         @meetiva/shared-types — pure TypeScript types
  frontend/       React 19 + Vite SPA (port 5173)
  backend/        Express API (port 8000) — separate npm install
```

`backend/package-lock.json` and `backend/bun.lock` exist alongside root `package-lock.json`. Install each package independently.

## Quick Start

```bash
cd shared && npm install && npm run build    # must build shared types first
cd frontend && npm install                   # depends on @meetiva/shared-types
cd backend && npm install                    # independent
npm run dev                                  # runs frontend + backend concurrently
```

## Commands

| What | Command |
|------|---------|
| Dev (both) | `npm run dev` (from root) |
| Dev frontend only | `cd frontend && npm run dev` |
| Dev backend only | `cd backend && npm run dev` |
| Build shared | `cd shared && npx tsc` |
| Build frontend | `cd frontend && npm run build` (runs tsc + vite build) |
| Build backend | `cd backend && npx tsc` |
| Lint frontend | `cd frontend && npm run lint` (ESLint, max 15 warnings) |
| Type-check frontend | `cd frontend && npm run type-check` |
| Type-check shared | `cd shared && npm run type-check` |
| Test frontend | `cd frontend && npm test` (Jest + ts-jest + jsdom) |
| Seed DB | `cd backend && npm run db:seed` |
| Production | `npm run build && npm run start` (PM2 via ecosystem.config.cjs) |

**No root-level lint/typecheck/test scripts.** Run them per-package.

## Path Aliases

| Alias | Resolves to | Used in |
|-------|-------------|---------|
| `@/*` | `./src/*` | frontend, backend |
| `@meetiva/shared-types` | `../shared/dist/index.d.ts` | frontend, backend |
| `@shared` | `../backend/src/lib/` | frontend only (via vite alias + tsconfig) |
| `@shared/schemas` | `../backend/src/lib/schemas.ts` | frontend only |

**Critical:** `shared/` must be built (`npm run build`) before frontend or backend can resolve `@meetiva/shared-types`.

## Shared Schemas

`backend/src/lib/schemas.ts` contains Zod schemas shared between frontend and backend:
- Backend imports: `import { ... } from '../lib/schemas'`
- Frontend imports: `import { ... } from '@shared/schemas'`

## Frontend Details

- **Tailwind CSS v4** — CSS-first config. No `tailwind.config.js`. Configuration is in `src/index.css` via `@import "tailwindcss"` + `@theme inline`.
- **shadcn/ui** — components in `src/components/ui/`. Add via `npx shadcn@latest add <component>`.
- **React 19** — pinned via root `overrides`. Do not upgrade to a different major version.
- **Auth flow:** httpOnly cookies (refresh token) + Redux state (access token). `AuthInitializer` in `App.tsx` restores session on mount via `POST /auth/refresh`.
- **Vite proxy:** `/api` requests proxy to `http://localhost:8000` in dev. `VITE_API_BASE_URL` should be `/api/v1` (relative) for cookie support.

## Backend Details

- **Express 5** (not 4). Route handlers use async — errors caught by `errorHandler` middleware.
- **Env validation:** `MONGODB_URI` and `JWT_SECRET` (min 32 chars) are required. Server crashes without them.
- **LLM provider chain:** Groq (default) → xAI/Grok (fallback) → Cerebras (fallback). Configured via `GROQ_API_KEY`, `GROK_API_KEY`/`XAI_API_KEY`, `CEREBRAS_API_KEY`.
- **MongoDB + Redis:** MongoDB required. Redis optional (in-memory rate limiting fallback).
- **Background jobs:** `deadlineNotifier` and `refreshTokenCleanup` run as intervals in the Express process.
- **API prefix:** All routes mounted at `/api/v1/*`. Non-versioned aliases exist for `/auth` and `/calendar`.

## Environment Variables

Copy `.env.example` to `.env` in both `backend/` and `frontend/`. Backend requires at minimum:
- `MONGODB_URI` (local or Atlas)
- `JWT_SECRET` (32+ chars)

Optional but needed for full functionality:
- `GROQ_API_KEY` — for transcription (or `WHISPER_API_KEY`)
- `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` — for calendar integration

## Testing

- **Frontend:** Jest in `frontend/src/__tests__/`. Test files: `*.test.{ts,tsx}`. Setup file: `src/__tests__/setup.ts`.
- **Backend:** Ad-hoc test scripts in `backend/src/tests/` and `backend/tests/`. Run with `tsx <file>`. Uses `mongodb-memory-server` for DB tests.
- **No CI workflow** in the repo.

## Pre-commit Checks (CI must stay green)

Run these **before every commit** to catch errors early:

```bash
# Frontend — type check + lint
cd frontend && npm run type-check && npm run lint

# Backend — type check (no linter configured)
cd backend && npx tsc --noEmit
```

**If type-check fails:**
- Fix the errors before committing.
- Pre-existing errors (e.g., missing `accountType`/`organizationId`/`orgRole` on `User` type) are exceptions — note them in the commit message if shipping alongside unrelated fixes.

**If lint fails:**
- Fix all errors. Warnings are allowed (max 15).

**Never commit without running type-check and lint first.**

## Style

- **Prettier** (frontend only): single quotes, trailing commas (es5), 100 char width, 2-space indent.
- **ESLint** (frontend only): `no-explicit-any: warn`, `no-unused-vars: error` (prefix unused args with `_`). `no-undef` is off (TypeScript handles it).
- **No backend linter** configured.

## Gotchas

- `shared/` build is a prerequisite for everything. If you see `Cannot find module '@meetiva/shared-types'`, run `cd shared && npm run build`.
- Backend `dotenv.config` uses `override: true` — shell env vars won't override `.env` file values.
- Frontend `@shared` alias points into `backend/src/lib/` — a cross-package reference that bypasses the workspace boundary.
- Backend tests use `tsx` directly, not a test runner. No `npm test` script in backend.
- `ecosystem.config.cjs` is for PM2 production deployment only.
