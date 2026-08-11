# Deployment Guide — Meetiva.ai

Meetiva runs as **one process**: the Express backend serves the built React SPA
(`frontend/dist`) **and** the `/api/v1` REST API on the same port. No separate
frontend server is needed. This makes it trivial to deploy on any platform that
can run a Node process.

| Piece | Runs as |
|-------|---------|
| Web UI (React SPA) | Static files served by Express from `frontend/dist` |
| REST API (`/api/v1/*`) | Express on the same port |
| Auth / cookies | httpOnly refresh cookie — **must stay same-origin** (keep `VITE_API_BASE_URL=/api/v1`) |
| MongoDB | External — Atlas or any Mongo 6+ (required) |
| Redis | Optional — shared rate limits across instances |

---

## 0. Verify locally first (optional but recommended)

```bash
npm ci                # workspace deps (shared, frontend, admin) — npm 11 (latest)
cd backend && npm ci  # backend deps
npm run build         # shared → frontend → backend
PORT=8000 node backend/dist/index.js
# open http://localhost:8000 and check http://localhost:8000/health
```

---

## 1. Render (recommended — blueprint included)

A ready-made **`render.yaml`** lives in the repo root.

1. Push this repo to GitHub.
2. In [Render](https://render.com): **New + → Blueprint → connect the repo**.
   Render reads `render.yaml`, creates the web service (and an internal free
   Redis), and deploys.
3. Set the required environment variables under **Service → Environment**
   (they are marked `sync: false` in the blueprint):

   | Variable | Required | Notes |
   |----------|----------|-------|
   | `MONGODB_URI` | ✅ | Your Atlas connection string |
   | `JWT_SECRET` | ✅ | ≥32 chars, unique per environment |
   | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for calendar | |
   | `GOOGLE_TOKEN_ENCRYPTION_KEY` | for calendar | 32-byte key (see `backend/.env.example`) |
   | `GOOGLE_REDIRECT_URI` | for calendar | `https://<app>.onrender.com/auth/google/callback` |
   | `GROQ_API_KEY` (or Grok/Cerebras keys) | for AI | `WHISPER_API_KEY` if Groq Whisper is blocked |
   | `ADMIN_EMAIL` | for self-upgrade | Your email → can flip PRO/TEAM |
   | `SMTP_*`, `EMAIL_FROM` | for email | Deadline alerts, OTPs, resets |
   | `CORS_ORIGIN` | for prod | Your app origin (Render sets the host itself) |
   | `FRONTEND_APP_URL` | for email links | `https://<app>.onrender.com` |
   | `REDIS_URL` | optional | Auto-wired to the blueprint Redis |

4. In **Runtime** settings, pick **Node 20.x (≥20.17)** (matches CI). npm 11
   requires Node ^20.17.0 — every current 20.x satisfies this, and the build
   command pins **npm 11** itself, so it works regardless of the bundled npm.
5. Health check is `/health` (already configured).

Build command (`npm ci --include=dev` + `tsc`/`vite` for each package) and
start command (`node backend/dist/index.js`) are already in `render.yaml`.
`PORT` is injected by Render automatically.

---

## 2. Railway (alternative)

Railway builds from the repo (Nixpacks/Railpack) with no Dockerfile needed.

- **Root directory:** repo root
- **Build:** use `npm run build` (after `npm ci` of both packages) — or set
  a custom build command that pins npm 11 first:
  `npm i -g npm@11 && npm ci && cd backend && npm ci && cd .. && npm run build`
- **Start:** `npm run start:web` (= `node backend/dist/index.js`)
- **Health check:** `GET /health` (Railway checks the TCP port by default; a
  healthcheck path can be added in the service settings)
- **Variables:** same as the table above. Set `NODE_ENV=production`.

---

## 3. Fly.io (needs a Dockerfile)

Fly.io deploys containers, so it requires a Dockerfile. None is checked in
(yet). If you want Fly: add a multi-stage `Dockerfile` that installs all three
packages, builds shared → frontend → backend, and starts
`node backend/dist/index.js` with `EXPOSE $PORT`. The rest of this guide still
applies (env vars, health check).

---

## 4. VPS with PM2 + Nginx (existing configs)

`ecosystem.config.cjs` and the nginx templates were built for a VPS:

```bash
npm ci && cd backend && npm ci && npm run build && npm run start
```

- PM2 runs `backend/dist/index.js` on port 8000 (see `ecosystem.config.cjs`).
- ⚠️ The checked-in `frontend/nginx.conf` / `nginx.prod.conf` serve *static*
  files only and **do not proxy `/api`** — they must not be used as-is. For a
  single-port deployment, Nginx should be a pure reverse proxy:

  ```nginx
  server {
      listen 80;
      server_name meetiva.example.com;

      client_max_body_size 500M;

      location / {
          proxy_pass http://127.0.0.1:8000;
          proxy_set_header Host $host;
          proxy_set_header X-Real-IP $remote_addr;
          proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
          proxy_set_header X-Forwarded-Proto $scheme;
      }
  }
  ```

  Add TLS via certbot. Behind a proxy, set `TRUST_PROXY=1` if your backend
  honors it (see `backend/src/lib/env.ts`), so cookies/rate limits see the
  real client IP.

---

## Environment variables

Full reference: `backend/.env.example`. Required at boot: `MONGODB_URI`,
`JWT_SECRET`. Everything else is optional and degrades gracefully
(AI falls back across Groq → Grok → Cerebras; Redis falls back to in-memory
per-instance limits; email falls back to console logging).

## Gotchas

- **Node & npm versions:** Keep Node 20.x and npm 11 to keep installs consistent across local dev, CI, and the deploy platform.
- **`shared/` must be built before frontend/backend** — `npm run build` handles
  the order; never deploy a `frontend/dist` or `backend/dist` built from stale
  shared types.
- **Lockfiles are npm-11 format.** Use **npm 11 (latest)** everywhere — install,
  `npm ci`, and lockfile regeneration (`npx npm@11 install` when bumping deps).
  npm 10's strict `npm ci` can reject npm-11 lockfiles, so keep npm 11
- **`backend/dist` and `frontend/dist` are gitignored.** Build on the server/
  platform during deploy (all configs above do).
- **Cookies need same-origin.** Keep `VITE_API_BASE_URL=/api/v1`. Split-domain
  setups require absolute URLs **and** cookie `secure/domain` handling.
- **Uploads:** `UPLOAD_DIR` defaults to `backend/uploads` (ephemeral on most
  PaaS). For long-lived transcripts, mount persistent storage there or point
  `UPLOAD_DIR` at a bucket (uploads are deleted after processing in this app).
- **Background jobs** (`deadlineNotifier`, `refreshTokenCleanup`) run inside
  the web process — one instance is assumed. Don't scale to multiple web
  instances without Redis + a job lock.
