# Meetiva 🚀

## Freely attend your Meeting, Meetiva is ready for Reporting

**Meetiva** is an AI-powered meeting intelligence platform that automatically converts conversations into summaries, action items, and tracked tasks—so teams spend less time remembering and more time executing.

Meetiva listens to meetings, understands context, identifies decisions, assigns ownership, and integrates directly into your existing workflow tools like JIRA, Slack, and Google Calendar.

---

## 📋 Table of Contents

* [Problem Statement](#-problem-statement)
* [Solution Overview](#-solution-overview)
* [Core Features](#-core-features)
* [Technical Architecture](#️-technical-architecture)
* [Technology Stack](#️-technology-stack)
* [How It Works](#️-how-it-works)
* [Use Cases](#-use-cases)
* [Installation & Setup](#-installation--setup)
* [API Documentation](#-api-documentation)
* [Future Roadmap](#-future-roadmap)
* [Contributing](#-contributing)
* [License](#-license)

---

## 🎯 Problem Statement

Meetings are where decisions are made—but they are also where execution breaks down.

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

## 💡 Solution Overview

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

## ✨ Core Features

### 🎙️ AI-Powered Transcription

* Supports audio and video uploads
* Multi-language transcription with automatic detection
* Handles accents, noise, and technical terminology

### 🧠 Intelligent Summarization

* Executive summary for quick review
* Key discussion points and decisions
* Open questions and unresolved topics

### ✅ Action Item Extraction

* Detects tasks from natural language
* Assigns owners and deadlines
* Categorizes and prioritizes tasks

### 🔥 Priority & Sentiment Analysis

* Identifies urgency using tone and repetition
* Flags critical items automatically
* Helps teams focus on what matters most

###  Analytics Dashboard

* Task completion rates
* Meeting effectiveness metrics
* Productivity trends over time

### 🔐 Security & Privacy

* AES-256 encryption at rest
* TLS 1.3 in transit
* Role-based access control
* GDPR-compliant data handling

---

## 🏗️ Technical Architecture

Meetiva is built as a scalable, cloud-native system.

### High-Level Overview

* **Frontend**: React + TypeScript
* **Backend**: Node.js + TypeScript
* **AI Pipeline**: Whisper, AssemblyAI, LLMs, OpenAI
* **Async Processing**: Background workers + Redis
* **Storage**: PostgreSQL + S3

### Core Components

* API Gateway for authentication and routing
* AI processing pipeline for transcription and NLP
* Queue-based background processing

---

## 🛠️ Technology Stack

### Backend

* Node.js + TypeScript
* Express
* PostgreSQL
* Prisma ORM
* Redis

### Frontend

* React 18
* TypeScript
* Tailwind CSS
* Redux Toolkit
* Axios

### Infrastructure

* Supabase (PostgreSQL + Authentication + Storage)
* Cloud hosting (Vercel / Railway / AWS)

---

## ⚙️ How It Works

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

## 🎯 Use Cases

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

## 🚀 Installation & Setup

### Prerequisites

* Node.js 18+
* Supabase account (free tier available at https://supabase.com)
* Redis 7+ (optional, for production caching)

### Quick Start with Supabase

The recommended way to get started:

```bash
# 1. Create a Supabase project
# Go to https://app.supabase.com
# Click "New Project" and note your database password
# Get your connection string from Project Settings > Database

# 2. Install all dependencies
npm install

# 3. Set up environment
cp backend/.env.example backend/.env
# Edit backend/.env with your Supabase connection details:
# DATABASE_URL and DIRECT_URL from Supabase dashboard

# 4. Initialize database with Prisma
cd backend
npx prisma db push
npx prisma generate
cd ..

# 5. Start both frontend and backend
npm run dev
```

Access the application:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### Run Services Individually

```bash
# Frontend only
npm run dev:frontend-only

# Backend only
npm run dev:backend-only
```

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Set up Supabase connection
# 1. Copy .env.example to .env
cp .env.example .env

# 2. Add your Supabase credentials to .env
# Get connection strings from: Supabase Dashboard > Project Settings > Database
# Copy both "Connection string" (for DATABASE_URL) and "Direct connection" (for DIRECT_URL)

# Initialize database with Prisma
npx prisma db push
npx prisma generate

# Run backend
npm run dev

# Backend API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

#### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Environment Variables

Backend (.env):
```env
# Get these from Supabase Dashboard > Project Settings > Database
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-key-change-this-in-production
CORS_ORIGIN=http://localhost:3000,http://localhost:5173
```

Frontend (.env):
```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

---

## 📡 API Documentation

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

## 🧭 Future Roadmap

* Live meeting capture (Zoom, Meet, Teams)
* Knowledge base auto-generation
* Predictive deadline risk detection
* Real-time AI meeting co-pilot
* Enterprise compliance (SOC 2, HIPAA)

---

## 🤝 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Open a Pull Request

Please follow coding standards and include tests where applicable.

---

## 📄 License

This project is licensed under the **MIT License**.

You are free to use, modify, and distribute this software with attribution.
See the `LICENSE` file for full details.

---

### Meetiva exists for one reason

**Freely attend your Meeting, Meetiva is ready for Reporting.**
