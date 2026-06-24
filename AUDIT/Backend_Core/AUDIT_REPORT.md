# Backend Core — Audit Report

**Date:** June 24, 2026
**Module:** Backend Core (entry point, environment config, Prisma client, project config)
**Files Audited:** `backend/src/index.ts`, `backend/src/lib/env.ts`, `backend/src/lib/prisma.ts`, `backend/package.json`, `backend/tsconfig.json`, `backend/.env.example`

---

## 1. Overview

The backend is an Express.js (v4.21.2) REST API server written in TypeScript, serving as the primary API layer for the Meetiva.ai platform. It connects to a PostgreSQL database via Prisma ORM and provides endpoints for authentication, meeting management, AI analysis, calendar integration, teams, and workspace data.

---

## 2. Architecture & Structure

| Aspect | Details |
|--------|---------|
| **Runtime** | Node.js ≥ 20, TypeScript (ES2022 target, Node16 module) |
| **Framework** | Express.js 4.21.2 |
| **ORM** | Prisma Client 6.19.3 with PostgreSQL |
| **Auth** | JWT-based authentication with bcryptjs hashing |
| **Port** | 8000 (configurable via `PORT` env) |
| **Entry** | `src/index.ts` — server bootstrap with middleware stack |

### Directory Structure
```
backend/src/
├── index.ts              # Entry point — Express app setup
├── lib/
│   ├── env.ts            # Environment validation
│   └── prisma.ts         # Prisma client singleton
├── middleware/
│   ├── auth.ts           # JWT authentication
│   └── authorize.ts      # Role-based authorization
├── routes/
│   ├── actionItems.ts    # Action item CRUD
│   ├── ai.ts             # Grok AI proxy endpoint
│   ├── auth.ts           # Auth routes (login, register, OAuth)
│   ├── calendar.ts       # Google Calendar integration
│   ├── meetings.ts       # Meeting CRUD + upload + export
│   ├── notifications.ts  # User notifications
│   ├── teams.ts          # Team management + chat
│   └── workspace.ts      # Workspace overview
├── services/
│   ├── googleCalendar.ts     # Google OAuth + Calendar API
│   ├── grokMeetingAnalyzer.ts # AI meeting analysis
│   ├── meetingStatus.ts      # Status sync service
│   └── whisperTranscriber.ts  # OpenAI Whisper integration
├── jobs/
│   └── deadlineNotifier.ts  # Scheduled deadline reminders
└── tests/
    └── actionItemsExport.test.ts  # ExcelJS export test
```

---

## 3. Environment Configuration

### Required Variables
| Variable | Purpose | Validated? |
|----------|---------|------------|
| `DATABASE_URL` | PostgreSQL connection (with PgBouncer) | ✅ Yes |
| `DIRECT_URL` | Direct PostgreSQL connection | ✅ Yes |
| `JWT_SECRET` | JWT signing key (min 32 chars) | ✅ Yes + length check |

### Optional but Important
| Variable | Purpose |
|----------|---------|
| `OPENAI_API_KEY` | Required for Whisper transcription |
| `GROK_API_KEY` / `XAI_API_KEY` | Required for AI meeting analysis |
| `GOOGLE_CLIENT_ID/CLIENT_SECRET` | Required for Google Calendar |
| `GOOGLE_TOKEN_ENCRYPTION_KEY` | AES-256-GCM encryption key (32 bytes) |
| `SMTP_HOST/USER/PASSWORD` | Email notifications |

### ✅ Strengths
- Startup validation of required env vars via `validateBackendEnv()`
- JWT secret length enforcement
- Graceful warning for missing optional AI keys

### ⚠️ Issues & Recommendations
1. **`env.ts`** — The `validateBackendEnv()` function is called at module import time in `index.ts`. If validation fails, the process crashes with an uncaught `throw`. Consider using a try-catch at startup for better error reporting.
2. **Missing `SUPABASE_URL`/`SUPABASE_SERVICE_ROLE_KEY` check** — The backend uses Prisma directly, but `.env.example` includes Supabase env vars. These are not validated.

---

## 4. Server Entry Point (`index.ts`)

### CORS Configuration
```typescript
// Intelligent CORS — allows localhost, explicit origins, blocks unknown in production
origin: (origin, callback) => { ... }
```

✅ **Strengths:**
- Supports multiple origins via `CORS_ORIGIN` comma-separated env var
- Allows localhost patterns (IPv4, IPv6) for development
- Strict mode in production — blocks unknown origins
- Credentials enabled for cookie-based OAuth flow

### Rate Limiting
- A rate limiter is applied to the wildcard `*` route (SPA fallback) — 100 requests/15 min
- ✅ Good for protecting static file serving
- ❌ **Missing:** API routes lack individual rate limiting. Consider applying per-endpoint rate limits.

### Route Mounting
```
/api/v1/auth          → Auth routes
/api/v1/ai            → AI proxy
/api/v1/meetings      → Meetings
/api/v1/action-items  → Action items
/api/v1/teams         → Teams
/api/v1/calendar      → Calendar
/api/v1/notifications → Notifications
/api/v1/workspace     → Workspace
/auth                 → Alias (for OAuth callback compatibility)
/calendar             → Alias
/*                    → SPA fallback (static frontend)
```

✅ **Strengths:**
- Clean versioned API prefix (`/api/v1/`)
- Alias routes for external integration compatibility (Google OAuth callback)
- Static frontend serving from `frontend/dist`

### ⚠️ Issues Found
1. **Logging middleware is placed AFTER route mounting** — The `console.log` middleware at line ~66 runs after route handlers. It will not log all requests as intended. Move it before route mounting.
2. **Error handler is after static file catch-all** — The generic error handler at line ~68 will never be reached for API routes if they handle errors inline (they do). But errors from the static SPA fallback will be caught.
3. **No graceful shutdown** — There's no `process.on('SIGTERM')` or `process.on('SIGINT')` handler to close DB connections gracefully.

---

## 5. Prisma Client (`lib/prisma.ts`)

```typescript
// Dynamically builds URL with PgBouncer and connection limit settings
const buildRuntimeDatabaseUrl = (): string => { ... }
```

✅ **Strengths:**
- Auto-appends `pgbouncer=true` and `connection_limit=1` for serverless/connection-pooling compatibility
- Falls back between `DATABASE_URL` and `DIRECT_URL`

### ⚠️ Issues
- `buildRuntimeDatabaseUrl()` modifies the URL via URL constructor each time Prisma is instantiated. This is fine for singleton use, but the function could be cached.

---

## 6. TypeScript Configuration

| Setting | Value | Assessment |
|---------|-------|------------|
| `target` | ES2022 | ✅ Modern |
| `module` | Node16 | ✅ ESM-compatible |
| `strict` | true | ✅ Full strict mode |
| `rootDir` | `./src` | ✅ Clean output structure |
| `paths` | `@/* → ./src/*` | ✅ Path alias |

✅ **Strengths:**
- Full strict mode enabled
- Source maps enabled for debugging
- Declaration files generated

---

## 7. Dependencies Analysis

### Production Dependencies
| Package | Version | Purpose | Security |
|---------|---------|---------|----------|
| `@prisma/client` | 6.19.3 | Database ORM | ✅ Latest |
| `bcryptjs` | 3.0.3 | Password hashing | ✅ Good |
| `express` | 4.21.2 | Web framework | ✅ Latest patch |
| `jsonwebtoken` | 9.0.2 | JWT auth | ✅ Stable |
| `multer` | 2.1.1 | File uploads | ⚠️ Moderate (file upload risk) |
| `express-rate-limit` | 8.3.1 | Rate limiting | ✅ |
| `express-validator` | 7.2.1 | Input validation | ✅ |
| `googleapis` | 171.4.0 | Google API client | ✅ |
| `exceljs` | 3.4.0 | Excel export | ✅ |

### Overrides (security patches)
```json
{
  "path-to-regexp": "0.1.13",
  "lodash": "^4.17.24",
  "fast-csv": "5.0.7",
  "tmp": "0.2.7"
}
```
✅ Good security hygiene with dependency overrides.

---

## 8. Overall Assessment

**Rating: B+ (Good)**

### ✅ Strengths Summary
- Well-structured Express app with clean route separation
- Strong environment validation at startup
- Proper CORS handling with production safety
- TypeScript with full strict mode
- Modern dependency versions
- Security overrides for transitive dependencies

### ⚠️ Critical Action Items
1. **Move logging middleware before route mounting** in `index.ts`
2. **Add graceful shutdown handlers** for DB connections
3. **Add API-level rate limiting** (not just for static files)
4. **Consider caching the `buildRuntimeDatabaseUrl()`** result
5. **Add try-catch around `validateBackendEnv()`** for better startup error reporting

---

**Next Steps:** Review Route Layer audit for endpoint security analysis.
