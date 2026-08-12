# Meetiva.ai — Comprehensive Security, Dependency & Code Review Report

**Date:** August 12, 2026
**Scope:** Full-stack application — Express 5 + MongoDB/Mongoose backend, React 19 + Vite frontend, Node 24 / npm 11
**Status:** ✅ **Green baseline** — deployable; remaining items are low/medium hardening, none blocking
**Previous report:** June 26, 2026 (Prisma/PostgreSQL era — superseded; the stack has since moved to Express + MongoDB and most findings were remediated)

---

## 1. Test Baseline (verified live, August 12, 2026)

| Layer | Command | Result |
|---|---|---|
| **Backend tsc** | `npx tsc --noEmit` | ✅ Clean (0 errors) |
| **Backend security tests** | `npm run test:security` (querySafetyPlugin, validationHelpers, firebaseStorage) | ✅ 24 passed, 0 failed |
| **Backend rate limiters** | `tsx src/tests/rateLimiters.test.ts` | ✅ 58 passed, 0 failed |
| **Backend calendar schema** | `tsx src/tests/calendarEventSchema.test.ts` | ✅ 11 passed, 0 failed |
| **Frontend tsc** | `npm run type-check` | ✅ Clean (0 errors) |
| **Frontend lint** | `npm run lint` | ⚠️ 0 errors, 1 warning (pre-existing `exhaustive-deps` in `TeamReport.tsx:42`) |
| **Frontend Jest** | `npm test` | ✅ 6 suites, 37 tests passed |
| **Backend npm audit (prod)** | `npm audit --omit=dev` | ✅ **0 vulnerabilities** |
| **Root workspace audit** | `npm audit` | ✅ **0 vulnerabilities** |
| **CI (GitHub Actions)** | `.github/workflows/CI.yml` | ✅ Latest commit `1f0b594` → **success** (backend tsc, frontend tsc/lint/test/build, security scans, gitleaks, codeql) |

---

## 2. Current Stack (what the June report's Prisma/PostgreSQL references were replaced with)

| Dependency | Version | Notes |
|---|---|---|
| express | 5.2.1 | Express 5 — async errors routed to global handler |
| mongoose | ^9.7.4 | MongoDB ODM |
| helmet | ^8.3.0 | Security headers |
| bcryptjs | ^3.0.3 | Per-user salt stored in `passwordSalt` (see `lib/password.ts`) |
| jsonwebtoken | ^9.0.3 | 15m access tokens + 7-day rotating refresh tokens |
| zod | ^4.4.3 | Request validation (shared schemas, frontend+backend) |
| googleapis | ^173.0.0 | Google Calendar + Sign-In OAuth |
| multer | ^2.2.0 | In-memory uploads with size limits |
| express-rate-limit | ^8.5.2 | Redis-backed store with in-memory fallback |
| Node | >=22 (CI runs 24) | `.node-version`=24, engines `>=22.0.0` |
| npm | >=11 <12 | Lockfiles are npm-11 format |

---

## 3. Security Infrastructure (verified present in current code)

| Control | Where | Status |
|---|---|---|
| **Helmet** | `index.ts:50` (`crossOriginEmbedderPolicy: false`) | ✅ |
| **Rate limiting** | `lib/rateLimiters.ts` — `authLimiter` 10/5min, `apiLimiter` 60/1min, `uploadLimiter` 20/hr, `otpLimiter` 5/5min | ✅ |
| **httpOnly refresh cookie** | `auth.ts:149` — `httpOnly: true, sameSite: 'lax', secure: prod` | ✅ |
| **Access token NOT in localStorage** | Frontend stores token in module-level variable / Redux memory only | ✅ |
| **JWT revocation** | `tokenVersion` checked on every request (`middleware/auth.ts:66`); bumped on password change | ✅ |
| **Refresh token rotation + hashing** | SHA-256 hash stored, rotated on use, max 5 per user (multi-tab safe) | ✅ |
| **NoSQL injection protection** | `querySafetyPlugin.ts` (blocks `$` operators) + `sanitizeObjectId` on all route params + CI static scan `check-query-safety.ts` | ✅ |
| **Zod validation** | Every request body validated; `iso8601Field` accepts local offsets (calendar fix) | ✅ |
| **OTP brute-force guard** | `MAX_OTP_ATTEMPTS=5`, 60s cooldown, `MAX_OTP_RESENDS=3` | ✅ |
| **XSS sanitization** | `sanitize()` on user text incl. multer multipart path (`meetings.ts:258`) | ✅ |
| **Body size limits** | `express.json({ limit: '1mb' })` + `MAX_FILE_SIZE` for uploads | ✅ |
| **OAuth CSRF (state)** | Separate state cookies for login vs calendar flows; ID-token signature+audience verification | ✅ |
| **Passwordless accounts** | `hashedPassword: null` (Google sign-in); set-password flow; all `verifyPassword` call sites guarded | ✅ |
| **Password policies** | bcrypt (cost 10) + per-user salt; reset tokens in Redis (in-memory fallback) | ✅ |
| **Trust proxy** | `app.set('trust proxy', 1)` for correct client IP behind reverse proxy | ✅ |
| **CORS** | Allowlist via `CORS_ORIGIN` + automatic localhost patterns | ✅ |

---

## 4. Previous Report Findings — Rechecked Against Current Code

### Security (S)

| # | Finding (June) | Current status |
|---|---|---|
| S1 | Legacy `GET /auth/google` leaks JWT — CRITICAL | ✅ **RESOLVED** — removed; only `/auth/google/login` + `/google/init` exist |
| S2 | `.env.example` with realistic secrets — HIGH | ✅ **RESOLVED** — placeholders only (`your-super-secret-key-…`); real secrets never committed (gitleaks-clean) |
| S3 | `path-to-regexp` override pins vulnerable version — HIGH | ✅ **RESOLVED** — override removed; Express 5.2.1; **0 audit vulns** |
| S4 | No Dependabot config — MEDIUM | ✅ **RESOLVED** — `.github/dependabot.yml` present |
| S5 | Password reset token logged — MEDIUM | ✅ **RESOLVED** — removed |
| S6 | JWT in localStorage — MEDIUM | ✅ **RESOLVED** — module-level variable only |
| S7 | No Helmet.js — LOW | ✅ **RESOLVED** — installed |
| S8 | CI copies `.env.example` — LOW | ✅ **ACCEPTED** — placeholders only; harmless in CI |
| S9 | Body size limits (1mb) — LOW | 🔶 **OPEN (low)** — still 1mb JSON; uploads use separate `MAX_FILE_SIZE` limit. Adequate for this API |
| S10 | In-memory password reset tokens — MEDIUM | 🟡 **MITIGATED** — Redis is primary; in-memory fallback is intentional for single-instance deploys (documented in DEPLOYMENT.md) |

### Ponytail / Over-engineering (P)

| # | Finding | Current status |
|---|---|---|
| P1 | Redux + React Query overlap | 🔶 **STILL OPEN** — both `@tanstack/react-query` and Redux Toolkit (4 slices) are used for server state. Consolidation opportunity (1–2 days) |
| P3 | Legacy GET /auth/google | ✅ RESOLVED |
| P4 | cookie-parser on all routes | 🟢 Low — required for auth cookies; no action |
| P5 | exceljs for simple export | 🔶 **STILL OPEN** — `lib/excelFormatter.ts` uses ExcelJS; heavy but **0 vulns** now. CSV swap = optional |
| P6 | 20 named schemas used once | 🟢 Low — inline or keep; validation helper style is consistent |
| P7 | clsx + tailwind-merge overlap | 🟢 **STILL OPEN** — both deps present; `cn()` uses both. Minor |

### Dependency Vulnerabilities

| Severity | June | Now |
|---|---|---|
| CRITICAL | 1 (axios) | ✅ 0 |
| HIGH | 2 (path-to-regexp, qs) | ✅ 0 |
| MODERATE | 2 (qs) | ✅ 0 |

---

## 5. New Since Last Report (added Aug 12 — reviewed during this session)

| Change | Review notes |
|---|---|
| **Google Sign-In** (`/auth/google/login` + callback) | Identity-only scopes (`openid/email/profile`, no calendar); state cookie CSRF; ID-token signature+audience check; account linking by `googleId`→email; duplicate-key race handled; separate from calendar OAuth |
| **Passwordless accounts** (`hashedPassword: null`) | Null-hash guards on login, change-password, delete-account; `hasPassword` exposed on `/me`/`/refresh`; `googleId` sparse unique index |
| **One-time migration** `db:migrate:google-passwordless` | Dry-run by default, `--before` cutoff, idempotent, verified as no-op against Atlas |
| **Calendar datetime fix** | `toLocalIsoString` normalizes to ISO-8601 with local offset (no silent UTC shift); backend `iso8601Field` accepts offsets; `timeZone` passed to Google API |
| **Per-user password salt** (`lib/password.ts`) | Salt column + bcrypt-embedded salt compat; all hashing centralized |
| **Deploy config** | `GOOGLE_LOGIN_REDIRECT_URI` added to `render.yaml` + `DEPLOYMENT.md`; Node 24 pinned everywhere (CI, `.node-version`, docs) |

---

## 6. Remaining Findings (current)

### Recommended before launch
| # | Finding | Severity | Effort |
|---|---|---|---|
| N1 | Publish Google OAuth **consent screen to Production** (currently Testing mode — only allowlisted test users can sign in) | 🔴 HIGH (prod launch) | 5 min |
| N2 | Register **production redirect URIs** in Google Cloud Console (`https://<app>.onrender.com/auth/google/login/callback` + `…/auth/google/callback`) | 🔴 HIGH (prod launch) | 5 min |
| N3 | Set unique **`JWT_SECRET`** (≥32 chars) + **`GOOGLE_TOKEN_ENCRYPTION_KEY`** (32 bytes) in prod env — placeholders never deployed | 🔴 HIGH | 2 min |
| N4 | Publish OAuth consent screen + verify **email verification flow** works with prod SMTP (currently falls back to console logging in dev) | 🟡 MEDIUM | 15 min |

### Non-blocking hardening
| # | Finding | Severity | Effort |
|---|---|---|---|
| H1 | Fix `TeamReport.tsx:42` exhaustive-deps lint warning | 🟢 Low | 5 min |
| H2 | P1: consolidate Redux + React Query for server state | 🔶 Medium | 1–2 days |
| H3 | P5: replace ExcelJS with CSV export to drop heavy dep | 🔶 Medium | 1 hr |
| H4 | P7: drop clsx (tailwind-merge alone suffices) | 🟢 Low | 15 min |
| H5 | Add pre-commit hook (backend tsc + frontend type-check/lint) to catch type breakage before push (CI already gates) | 🟢 Low | 30 min |
| H6 | Background jobs run in-process — keep **single web instance** (or add Redis + job lock before scaling) | 🟡 MEDIUM (ops) | documented |

---

## 7. Deployment Readiness

- ✅ CI green on latest commit; all builds pass locally
- ✅ 0 dependency vulnerabilities across backend + workspace
- ✅ No committed secrets; `.env` gitignored; Gitleaks + CodeQL in CI
- ✅ Single-port architecture (Express serves SPA + API) — Render blueprint, Railway, and PM2 configs present
- ✅ Health check `/health` configured for Render
- ✅ Google Sign-In + Calendar env vars now fully documented in deploy configs
- ⚠️ Complete items N1–N4 at launch time (all are console/env setup, no code)

---

## Disclaimer

This is an AI-assisted scan that catches common vulnerability patterns — not a substitute for a professional security audit. For production systems handling sensitive data, payments, or PII, engage a qualified security firm. Use this report as a first pass to catch low-hanging fruit between professional audits.
