# Meetiva.ai

AI-powered meeting intelligence platform that automatically converts conversations into summaries, meeting minutes, and actionable tasks — so teams spend less time remembering and more time executing.

---

## Features

### AI-Powered Transcription
- Audio/video upload (up to 25 MB) with **Groq Whisper** (whisper-large-v3)
- Multi-language support with automatic language detection
- LLM post-processing adds speaker labels and clean formatting

### Intelligent Summarization
- Three summary modes: **brief**, **standard**, and **detailed**
- Executive summary, key discussion points, decisions, and open questions
- Sentiment analysis for each meeting

### Meeting Minutes (MoM)
- Full structured minutes with agenda, attendees, discussion points, decisions, tasks, and next steps
- Export as styled PDF via PDFKit

### Action Item Extraction
- AI detects tasks from natural language with assignees, deadlines, and priorities
- Task management with status tracking (pending / in-progress / completed)
- Export tasks to Excel (.xlsx) via ExcelJS

### Team Collaboration
- Teams with roles: **Manager**, **Lead**, **Member**
- Invitation workflow with approval/rejection
- Team chat for follow-up discussions
- Team-based meeting and task visibility with RBAC

### Enterprise & Organizations
- Organization management with seat limits and provisioning
- Hierarchical roles: super_admin, admin, manager, team_leader, member
- User provisioning with temporary passwords
- Replacement-before-removal for managers and team leaders
- Content disposition on user removal

### Google Calendar Integration
- OAuth2 connection with encrypted token storage (AES-256-GCM)
- Create and list calendar events
- Automatic token refresh

### Analytics Dashboard
- Meeting stats, task completion rates, weekly activity charts
- Top participants and productivity trends
- Gated behind TEAM+ subscription

### Notifications
- Deadline reminders (24h before due date) via in-app and email
- OTP verification, password reset, password change emails

### Subscription Tiers
| Tier | Meetings | Teams | Analytics | Organizations |
|------|----------|-------|-----------|---------------|
| **FREE** | 5/month | No | No | No |
| **TEAM** | Unlimited | Yes | Yes | No |
| **ENTERPRISE** | Unlimited | Yes | Yes | Yes |

---

## Tech Stack

### Frontend
- **React 19** + TypeScript 5.9
- **Tailwind CSS v4** — CSS-first config via `@import "tailwindcss"` + `@theme inline`
- **Vite 8** — build tool with `@tailwindcss/vite` plugin
- **Redux Toolkit 2** — global state (auth, UI, workspace)
- **TanStack Query 5** — server state and caching
- **React Router v7** — routing with lazy-loaded routes
- **React Hook Form 7 + Zod 4** — form validation
- **shadcn/ui** — Radix-based component primitives
- **Recharts 3** — analytics charts
- **Framer Motion 12** — animations
- **Lucide React** — icons
- **Sonner** — toast notifications
- **date-fns 4** — date utilities

### Backend
- **Node.js 22** + TypeScript 5.9 + **Express 5**
- **MongoDB 9** + Mongoose ODM
- **Redis** (optional, falls back to in-memory rate limiting)
- **JWT** — stateless auth with httpOnly refresh token cookies
- **Nodemailer** — email notifications
- **PDFKit** — PDF export
- **ExcelJS** — Excel export
- **Google APIs** (googleapis 173) — Calendar integration
- **Helmet** — security headers
- **bcryptjs** — password hashing

### AI Pipeline
- **Groq Whisper** (whisper-large-v3) — speech-to-text transcription
- **Groq LLM** (llama-3.3-70b-versatile) — summarization, task extraction, minutes generation
- **xAI/Grok** — fallback LLM provider
- **Cerebras** — second fallback LLM provider
- Three LLM calls run in parallel for fast processing

### Shared
- **@meetiva/shared-types** — pure TypeScript types shared between frontend and backend

---

## Project Structure

```
Meetiva.ai/
├── shared/                  @meetiva/shared-types (pure TS types)
│   └── src/                 Enums, user/meeting/team/task/workspace types
│
├── frontend/                React 19 + Vite SPA (port 5173)
│   └── src/
│       ├── pages/           Route pages (auth, dashboard, meetings, tasks, etc.)
│       ├── components/      UI components, layout, shadcn/ui primitives
│       ├── hooks/           useAuth, useMeetings, useTeams
│       ├── store/           Redux slices (auth, ui, workspace)
│       ├── services/        API client, auth/meeting/team services
│       ├── lib/             Utilities, Zod validation schemas
│       └── types/           Frontend-specific type definitions
│
├── backend/                 Express API (port 8000)
│   └── src/
│       ├── lib/             Env validation, Redis, rate limiters, logger
│       ├── middleware/       Auth, RBAC, error handling
│       ├── models/          14 Mongoose schemas
│       ├── routes/          API route handlers
│       ├── services/        Whisper, Groq LLM, Google Calendar
│       ├── jobs/            Background tasks (deadline notifier, token cleanup)
│       └── prompts.ts       All LLM prompt templates
│
├── admin/                   Admin Panel (port 5174)
├── e2e/                     Playwright E2E tests
├── ecosystem.config.cjs     PM2 production config
└── render.yaml              Render Blueprint for deployment
```

---

## How It Works

1. **Upload meeting content** — audio/video file or paste a transcript
2. **AI transcription** — Groq Whisper transcribes audio; LLM formats with speaker labels
3. **Auto-summary** — Brief, standard, or detailed summary generated on upload
4. **Full analysis** — User triggers processing for tasks, minutes, and detailed summary (3 parallel LLM calls)
5. **Track and manage** — Edit tasks, export to Excel/PDF, monitor completion
6. **Collaborate** — Share via teams, chat, integrate with Google Calendar
7. **Automated reminders** — Deadline notifications via in-app and email

---

## Setup

### Prerequisites
- **Node.js 22+** and **npm 11+**
- **MongoDB** (Atlas or local instance)
- **Groq API key** — free at https://console.groq.com/keys

### Quick Start

```bash
# 1. Build shared types (required before frontend/backend)
cd shared && npm install && npx tsc

# 2. Install dependencies
cd ../frontend && npm install
cd ../backend && npm install

# 3. Configure environment
cd ../backend && cp .env.example .env   # Edit with your keys
cd ../frontend && cp .env.example .env

# 4. Run everything (from root)
npm run dev
```

This starts:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **Admin Panel**: http://localhost:5174

### Backend Environment Variables

```env
# Required
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/meetiva
JWT_SECRET=your-super-secret-key-min-32-chars

# AI (required for transcription)
GROQ_API_KEY=gsk_your-groq-api-key

# Fallback AI providers (optional)
GROK_API_KEY=your-xai-api-key
CEREBRAS_API_KEY=your-cerebras-api-key

# Google Calendar (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=your-32-byte-base64-or-hex-key
FRONTEND_APP_URL=http://localhost:5173

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=noreply@meetiva.ai

# Rate limiting (optional)
REDIS_URL=redis://localhost:6379
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=/api/v1
```

---

## API Endpoints

All routes mounted at `/api/v1/*`.

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Create account |
| POST | `/auth/login` | Sign in |
| POST | `/auth/logout` | Sign out |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Current user |
| PATCH | `/auth/me` | Update profile |
| POST | `/auth/password-reset` | Request reset link |
| POST | `/auth/password-reset/confirm` | Confirm reset with token |
| POST | `/auth/change-password` | Change password |
| POST | `/auth/verify-otp` | Verify email with OTP |
| POST | `/auth/verify-otp/resend` | Resend OTP |
| GET | `/auth/subscription` | Subscription info |
| POST | `/auth/admin/set-tier` | Self-upgrade tier |
| POST | `/auth/google/init` | Start Google OAuth |
| GET | `/auth/google/callback` | Google OAuth callback |

### Meetings
| Method | Path | Description |
|--------|------|-------------|
| GET | `/meetings` | List meetings |
| GET | `/meetings/stats` | Meeting statistics |
| GET | `/meetings/:id` | Meeting details |
| POST | `/meetings` | Create meeting |
| POST | `/meetings/upload` | Upload audio/video/txt |
| POST | `/meetings/:id/process` | Trigger full AI analysis |
| PATCH | `/meetings/:id` | Update meeting |
| DELETE | `/meetings/:id` | Delete meeting |
| GET | `/meetings/:id/summary` | AI summary |
| GET | `/meetings/:id/transcript` | Full transcript |
| GET | `/meetings/:id/action-items` | Extracted tasks |
| GET | `/meetings/:id/action-items/export` | Export tasks as Excel |
| GET | `/meetings/:id/minutes/export` | Export minutes as PDF |

### Action Items
| Method | Path | Description |
|--------|------|-------------|
| GET | `/action-items` | List tasks |
| GET | `/action-items/:id` | Task details |
| POST | `/action-items` | Create task |
| PATCH | `/action-items/:id` | Update task |
| DELETE | `/action-items/:id` | Delete task |
| POST | `/action-items/:id/complete` | Mark task complete |

### Teams
| Method | Path | Description |
|--------|------|-------------|
| POST | `/teams` | Create team |
| GET | `/teams` | List teams |
| GET | `/teams/:teamId` | Team details |
| GET | `/teams/:teamId/members` | List members |
| POST | `/teams/:teamId/invite` | Invite member |
| POST | `/teams/:teamId/members/:userId/approve` | Approve member |
| POST | `/teams/:teamId/members/:userId/reject` | Reject member |
| PATCH | `/teams/:teamId/members/:userId` | Update member role |
| DELETE | `/teams/:teamId/members/:userId` | Remove member |
| DELETE | `/teams/:teamId` | Delete team |
| GET | `/teams/:teamId/chat/messages` | Get chat messages |
| POST | `/teams/:teamId/chat/messages` | Post chat message |

### Calendar
| Method | Path | Description |
|--------|------|-------------|
| GET | `/calendar/status` | Connection status |
| GET | `/calendar/events` | List events |
| GET | `/calendar/events/upcoming` | Next 10 events |
| POST | `/calendar/create-event` | Create event |
| POST | `/calendar/disconnect` | Disconnect Google |

### Organizations
| Method | Path | Description |
|--------|------|-------------|
| POST | `/organizations` | Create org |
| GET | `/organizations` | List orgs |
| GET | `/organizations/:id` | Org details |
| GET | `/organizations/:id/users` | List org users |
| POST | `/organizations/:id/users/provision` | Provision user |
| GET | `/organizations/:id/seats` | Seat usage |

### Other
| Method | Path | Description |
|--------|------|-------------|
| GET | `/notifications` | List notifications |
| PATCH | `/notifications/:id/read` | Mark read |
| GET | `/workspace/overview` | Workspace overview |
| POST | `/ai/grok` | AI chat (Grok) |
| POST | `/ai/cerebras` | AI chat (Cerebras) |
| GET | `/health` | Health check |

---

## Authentication Flow

1. **Registration**: Create account → bcrypt hash → 6-digit OTP via email → access token + httpOnly refresh cookie
2. **Login**: bcrypt compare → 15-min JWT access token (in-memory) + 7-day refresh token (httpOnly cookie)
3. **Session restore**: On page load, `AuthInitializer` calls `POST /auth/refresh` using the httpOnly cookie
4. **401 handling**: `ApiClient` intercepts 401s, queues concurrent requests, retries after a single refresh
5. **Token security**: Access tokens stored in-memory only (not localStorage), refresh tokens SHA-256 hashed in DB, rotated on every use, max 5 per user
6. **Google OAuth**: State cookie (httpOnly, 10min) → redirect → callback validates → encrypt tokens (AES-256-GCM) → store

---

## Path Aliases

| Alias | Resolves to | Used in |
|-------|-------------|---------|
| `@/*` | `./src/*` | frontend, backend, admin |
| `@meetiva/shared-types` | `../shared/dist/index.d.ts` | frontend, backend |
| `@shared` | `../backend/src/lib/` | frontend only |
| `@shared/schemas` | `../backend/src/lib/schemas.ts` | frontend only |

**Important**: `shared/` must be built (`npx tsc`) before frontend or backend can resolve `@meetiva/shared-types`.

---

## Development

### Commands

| What | Command |
|------|---------|
| Dev (all) | `npm run dev` (from root) |
| Dev frontend | `cd frontend && npm run dev` |
| Dev backend | `cd backend && npm run dev` |
| Dev admin | `cd admin && npm run dev` |
| Build shared | `cd shared && npx tsc` |
| Build frontend | `cd frontend && npm run build` |
| Build backend | `cd backend && npx tsc` |
| Lint frontend | `cd frontend && npm run lint` |
| Type-check frontend | `cd frontend && npm run type-check` |
| Type-check backend | `cd backend && npx tsc --noEmit` |
| Test frontend | `cd frontend && npm test` |
| Seed DB | `cd backend && npm run db:seed` |

### Pre-commit Checks

```bash
# Frontend
cd frontend && npm run type-check && npm run lint

# Backend
cd backend && npx tsc --noEmit
```

---

## Permissions & Data Collection

### Google OAuth Permissions

| Scope | What It Accesses |
|-------|------------------|
| `calendar.events` | Read, create, and manage events on your primary Google Calendar |
| `userinfo.profile` | Access your Google profile name and picture |

- Tokens are encrypted at rest with **AES-256-GCM** before storage in MongoDB
- You can disconnect Google Calendar at any time via Settings

### Data Collected on Registration

| Field | Purpose |
|-------|---------|
| Email address | Account identification, login, notifications |
| Name | Display name across the platform |
| Password | Stored as bcrypt hash (cost factor 10) — never plaintext |

### Files You Upload

| Type | Formats | Max Size | What Happens |
|------|---------|----------|--------------|
| Audio | mp3, mp4, mpeg, mpga, m4a, wav, webm, ogg, aac | 25 MB | Sent to Groq Whisper API, then discarded |
| Video | mov, avi | 25 MB | Sent to Groq Whisper API, then discarded |
| Text | .txt | 25 MB | Read as plain text transcript |

- Files are held in **memory only** during processing — never written to disk
- Only the resulting transcript text is stored in MongoDB

### Cookies

| Cookie | httpOnly | Purpose | Duration |
|--------|----------|---------|----------|
| `refresh_token` | Yes | JWT refresh token for session renewal | 7 days |
| `session_exists` | No | Lets frontend detect an active session | 7 days |
| `google_oauth_state` | Yes | CSRF protection during Google OAuth | 10 minutes |
| `google_oauth_uid` | Yes | Holds user ID during Google OAuth | 10 minutes |

### Browser Storage

- **localStorage**: Theme preference, notification prefs, general prefs only
- **Access tokens**: Stored **in-memory only** — never in localStorage
- **Auth state**: Redux store (in-memory), not persisted

### Data Shared with Third Parties

| Service | Data Sent | Purpose |
|---------|-----------|---------|
| Groq API | Audio/video buffer (transcription), transcript text (analysis) | Speech-to-text and AI analysis |
| Google APIs | OAuth tokens, calendar read/write requests | Calendar event management |
| SMTP Server | Email address, OTP codes, reset links | Account verification and notifications |

- **No** third-party analytics, tracking, or advertising services
- **No** pixel tracking, beacons, or A/B testing frameworks

### Data Shared with Team Members

| Data | Who Sees It |
|------|-------------|
| Your name and email | All members of your teams |
| Your team role | All members of your teams |
| Your meetings | Only you (Members); Managers/Leads see their team's meetings |
| Team chat messages | All members of the team |
| Task assignments | Task assignees and team Managers/Leads |

### Security Controls

| Control | Detail |
|---------|--------|
| Passwords | bcrypt hashed (cost factor 10) |
| Access tokens | 15-minute JWT, in-memory only |
| Refresh tokens | httpOnly cookie, SHA-256 hashed in DB, rotated on every use |
| Token encryption | Google OAuth tokens encrypted with AES-256-GCM |
| Rate limiting | 4 tiers: auth (10/5min), API (60/min), upload (20/hr), OTP (5/5min) |
| CORS | Explicit origin allowlisting |
| CSP headers | Helmet security headers (self-only scripts/styles, no frames) |
| XSS prevention | HTML entity encoding on all user inputs |
| CSRF protection | State parameter in Google OAuth flow |
| Session revocation | `tokenVersion` field incremented to invalidate all sessions instantly |
| OTP brute-force protection | 5 failed attempts → 15min lockout, max 3 resends |

---

## Deployment

Production serves both the built React SPA and the REST API from the same Express process on port 8000.

```bash
npm run build && npm run start
```

Deployed via PM2 (`ecosystem.config.cjs`). Render Blueprint included (`render.yaml`).

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment guides (Render, Railway, Fly.io, VPS).

---

## Future Scope

- **Personal AI Assistant** — Personalized meeting and task support with contextual recommendations
- **More Integrations** — Google Meet, Zoom, and Teams for seamless meeting capture
- **Android & iOS Apps** — Meetiva anywhere, anytime on mobile devices
- **Backend Refactoring** — Faster, scalable & secure infrastructure
- **Advanced AI** — Live assistance, voice commands & predictive insights

---

## License

MIT License — see the [LICENSE](./LICENSE) file.
