# Meetiva 

## Turn Meetings into Meetiva

**Meetiva** is an AI-powered meeting intelligence platform that automatically converts conversations into summaries, action items, and tracked tasksso teams spend less time remembering and more time executing.

Meetiva listens to meetings, understands context, identifies decisions, assigns ownership, and integrates directly into your existing workflow tools like JIRA, Slack, and Google Calendar.

---

##  Table of Contents

* [Problem Statement](#-problem-statement)
* [Solution Overview](#-solution-overview)
* [Core Features](#-core-features)
* [Technical Architecture](#-technical-architecture)
* [Technology Stack](#-technology-stack)
* [How It Works](#-how-it-works)
* [Use Cases](#-use-cases)
* [Installation & Setup](#-installation--setup)
* [API Documentation](#-api-documentation)
* [Future Roadmap](#-future-roadmap)
* [Contributing](#-contributing)
* [License](#-license)

---

##  Problem Statement

Meetings are where decisions are madebut they are also where execution breaks down.

### Common Challenges

* Important action items are forgotten or poorly documented
* Manual note-taking distracts participants
* Ownership and deadlines are unclear
* Follow-ups require manual work across multiple tools
* Meeting recordings go unused due to time constraints

### The Result

* Lost productivity
* Missed deadlines
* Poor accountability
* Slower execution

Modern teams need meetings to **produce outcomes**, not just conversations.

---

##  Solution Overview

**Meetiva** acts as an AI meeting co-pilot that automatically:

* Transcribes meetings with high accuracy
* Identifies speakers and context
* Generates structured summaries
* Extracts action items with owners and deadlines
* Assigns priority using sentiment and urgency detection
* Syncs tasks to project management tools
* Sends reminders and follow-ups automatically

Meetiva closes the gap between **discussion and execution**.

---

##  Core Features

###  AI-Powered Transcription

* Supports audio and video uploads
* Multi-language transcription with automatic detection
* Handles accents, noise, and technical terminology

###  Intelligent Summarization

* Executive summary for quick review
* Key discussion points and decisions
* Open questions and unresolved topics

###  Action Item Extraction

* Detects tasks from natural language
* Assigns owners and deadlines
* Categorizes and prioritizes tasks

###  Priority & Sentiment Analysis

* Identifies urgency using tone and repetition
* Flags critical items automatically
* Helps teams focus on what matters most

###  Analytics Dashboard

* Task completion rates
* Meeting effectiveness metrics
* Productivity trends over time

###  Security & Privacy

* AES-256 encryption at rest
* TLS 1.3 in transit
* Role-based access control
* GDPR-compliant data handling

---

##  Technical Architecture

Meetiva is built as a scalable, cloud-native system.

### High-Level Overview

* **Frontend**: React + TypeScript
* **Backend**: Node.js + TypeScript
* **AI Pipeline**: Whisper, AssemblyAI, LLMs, OpenAI
* **Async Processing**: Background workers + Redis
* **Storage**: MongoDB + S3

### Core Components

* API Gateway for authentication and routing
* AI processing pipeline for transcription and NLP
* Queue-based background processing

---

##  Technology Stack

### Backend

* Node.js + TypeScript
* Express
* MongoDB + Mongoose ODM
* Redis

### Frontend

* React 18
* TypeScript
* Tailwind CSS
* Redux Toolkit
* Axios

### Infrastructure

* MongoDB Atlas
* Cloud hosting (Vercel / Railway / AWS)

---

##  How It Works

1. **Upload Meeting Content**
   Upload an audio/video file or paste a transcript.

2. **AI Processing**

   * Transcription
   * Speaker identification
   * Summarization
   * Action item extraction
   * Sentiment & priority scoring

3. **Results Delivered**

   * Structured summary
   * Action items dashboard
   * Editable tasks

4. **Automation & Sync**

   * Create tickets in project tools
   * Schedule calendar reminders
   * Notify teams via Slack or Teams

5. **Ongoing Tracking**

   * Daily reminders
   * Overdue alerts
   * Weekly productivity reports

---

##  Use Cases

### Product Teams

Sprint planning, retrospectives, roadmap discussions.

### Sales Teams

Client calls, discovery meetings, follow-ups.

### Leadership & Executives

Board meetings, strategy reviews, decision tracking.

### Remote & Async Teams

Recorded updates and distributed collaboration.

### Customer Support & Incident Reviews

Postmortems, root cause analysis, prevention planning.

---

##  Installation & Setup

### Prerequisites

* Node.js 20+ or Bun
* MongoDB Atlas account (or local MongoDB instance)
* Redis 7+ (optional, for production caching)

### Quick Start

```bash
# 1. Clone and install backend dependencies
cd backend
npm install
cp .env.example .env
# Edit backend/.env with your MongoDB URI and API keys

# 2. Clone and install frontend dependencies
cd ../frontend
npm install
cp .env.example .env

# 3. Start the backend (terminal 1)
cd backend
npm run dev

# 4. Start the frontend (terminal 2)
cd frontend
npm run dev
```

Access the application:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Environment Variables

Backend (`backend/.env`):
```env
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.xxxxx.mongodb.net/meetiva
JWT_SECRET=your-super-secret-key-change-this-in-production-min-32-chars
CEREBRAS_API_KEY=cerebras-your-api-key
CORS_ORIGIN=http://localhost:5173
```

Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

### Google Calendar OAuth 2.0 Setup

1. Create OAuth credentials in Google Cloud Console.
2. Add these redirect URIs:
   - http://localhost:8000/auth/google/callback
3. Add these scopes in your OAuth consent screen:
   - https://www.googleapis.com/auth/calendar.events
   - https://www.googleapis.com/auth/userinfo.profile
4. Add these backend environment variables:

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8000/auth/google/callback
GOOGLE_TOKEN_ENCRYPTION_KEY=your-32-byte-base64-or-hex-key
FRONTEND_APP_URL=http://localhost:5173
```

OAuth flow endpoints:
* GET /auth/google
* GET /auth/google/callback

Calendar API endpoints:
* POST /calendar/create-event
* GET /calendar/events

All token operations are server-side. Access and refresh tokens are encrypted before being stored.

### Sample User Flow (End-to-End)

1. Sign in to Meetiva.
2. Go to Workspace.
3. Click Connect Google Calendar.
4. Complete Google OAuth consent.
5. Return to Workspace and confirm status shows Connected.
6. Upload meeting audio or transcript.
7. Verify generated output:
   - concise summary
   - key decisions
   - follow-up action items
8. Create a calendar event from Workspace.
9. Verify event appears in Google Calendar.
10. Set an action item due within 24 hours and confirm reminder appears in Notifications.

### Team Setup Recommendation

For a team setup, keep all keys in a shared secret manager (for example 1Password, Bitwarden, Doppler, or Infisical) and never commit `.env` files.

Startup now includes preflight checks:
* Backend fails fast if required keys are missing (`MONGODB_URI`, `JWT_SECRET`).
* Frontend validates `VITE_API_BASE_URL` on startup.

---

##  API Documentation

Meetiva exposes a REST API with JWT authentication.

### Base URL

```
/api/v1
```

### Key Endpoints

* `POST /meetings/upload`
* `GET /meetings/{id}`
* `GET /meetings/{id}/summary`
* `GET /meetings/{id}/action-items`
* `GET /analytics/dashboard`

Swagger UI available at:

```
/docs
```

---

##  Future Roadmap

* Live meeting capture (Zoom, Meet, Teams)
* Knowledge base auto-generation
* Predictive deadline risk detection
* Real-time AI meeting co-pilot
* Enterprise compliance (SOC 2, HIPAA)

---

##  Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

Please follow coding standards and include tests where applicable.

---

##  License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this software with attribution.
See the `LICENSE` file for full details.

---

### Meetiva exists for one reason

**Meetings should create progress, not paperwork.**
