# Meetiva

AI-powered meeting intelligence platform that automatically converts conversations into summaries, action items, and tracked tasks — so teams spend less time remembering and more time executing.

Meetiva listens to meetings, understands context, identifies decisions, assigns ownership, and integrates directly into your workflow.

---

## Features

### AI-Powered Transcription
- Audio/video upload with **Groq Whisper** transcription
- Multi-language support
- Handles accents, noise, and technical terminology

### Intelligent Summarization
- Executive summary for quick review
- Key discussion points and decisions tracked
- Open questions and unresolved topics

### Action Item Extraction
- Detects tasks from natural language
- Assigns owners and deadlines
- Categorizes and prioritizes tasks

### Analytics Dashboard
- Task completion rates
- Meeting effectiveness metrics
- Productivity trends over time

### Security & Privacy
- AES-256 encryption at rest, TLS 1.3 in transit
- Role-based access (admin, editor, viewer)
- GDPR-compliant data handling

---

## Tech Stack

### Frontend
- **React 19** + TypeScript
- **Tailwind CSS v4** — CSS-first config via `@import "tailwindcss"`
- **Vite** — build tool with `@tailwindcss/vite` plugin
- **Redux Toolkit** — global state (auth, UI)
- **TanStack Query** — server state & caching
- **React Router v6** — routing
- **React Hook Form + Zod** — form validation
- **Axios** — HTTP client
- **Lucide React** — icons
- **shadcn/ui** — Radix-based component primitives
- **sonner** — toast notifications
- **tw-animate-css** — Tailwind animation utilities

### Backend
- **Node.js** + TypeScript + Express
- **MongoDB** + Mongoose ODM
- **Redis** — caching & rate limiting
- **JWT** — stateless auth

### AI Pipeline
- **Groq Whisper** — speech-to-text transcription
- **Gemini 2.0 Flash** — summarization, action-item extraction, intelligence

---

## Architecture

```
frontend/          React 19 + Vite SPA
backend/           Express API server
  src/
    lib/           shared utilities (env, jwt, errors, calendar client)
    middleware/    auth, validation, error handling
    routes/       API route handlers
    services/     business logic (whisperTranscriber, geminiAnalyzer, calendar)
    models/       Mongoose schemas (User, Meeting, ActionItem, Team)
```

---

## How It Works

1. **Upload meeting content** — audio/video file or paste a transcript
2. **AI processing** — Groq Whisper transcribes, Gemini analyzes for summary, action items, sentiment
3. **Results delivered** — structured summary, action items dashboard, editable tasks
4. **Automation & sync** — create calendar events, notify teams
5. **Ongoing tracking** — reminders, overdue alerts, weekly productivity reports

---

## Setup

### Prerequisites
- Node.js 20+
- MongoDB Atlas account (or local instance)
- Groq API key — free at https://console.groq.com/keys
- Gemini API key — free at https://aistudio.google.com/apikey

### Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Edit .env with your keys

# Frontend
cd frontend
npm install
cp .env.example .env

# Start backend (terminal 1)
cd backend
npm run dev

# Start frontend (terminal 2)
cd frontend
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Backend Environment Variables

```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/meetiva
JWT_SECRET=your-super-secret-key-min-32-chars
GROQ_API_KEY=gsk_your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=http://localhost:5173
```

### Frontend Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_GROQ_API_KEY=gsk_your-groq-api-key
```

### Team Setup Recommendation

For a team setup, keep all keys in a shared secret manager (for example 1Password, Bitwarden, Doppler, or Infisical) and never commit `.env` files.

Startup now includes preflight checks:
* Backend fails fast if required keys are missing (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`).
* Frontend fails fast if required keys are missing (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

---

## Roadmap

- Live meeting capture (Zoom, Meet, Teams)
- Knowledge base auto-generation
- Predictive deadline risk detection
- Real-time AI meeting co-pilot
- Enterprise compliance (SOC 2, HIPAA)

---

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

---

## License

MIT License — see the `LICENSE` file.
