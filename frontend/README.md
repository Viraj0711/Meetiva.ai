# Meetiva Frontend

React 19 + TypeScript + Vite SPA for the Meetiva AI meeting intelligence platform.

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

The app runs at `http://localhost:5173`.

### Production

```bash
npm run build
npm run preview
```

## Tech Stack

- **React 19** — UI library
- **TypeScript 5.x** — type safety
- **Vite** — build tool
- **Tailwind CSS v4** — CSS-first config via `@import "tailwindcss"` + `@tailwindcss/vite` plugin
- **Redux Toolkit** — global state (auth, UI)
- **TanStack Query** — server state & caching
- **React Router v6** — routing
- **React Hook Form + Zod** — forms & validation
- **Axios** — HTTP client
- **Lucide React** — icons
- **shadcn/ui** — Radix-based component primitives
- **sonner** — toast notifications
- **tw-animate-css** — animation utilities

## Project Structure

```
src/
  components/       Reusable components
    ui/             shadcn/ui primitives (Button, Card, Dialog, Input, etc.)
    layout/         Sidebar, Header, AppLayout
    common/         RoleBasedRoute, LoadingScreen
  pages/            Route-level page components
  store/            Redux store + slices (auth, ui)
  hooks/            Custom hooks (useAuth, useMeetings, useTeams, etc.)
  services/         API services
  lib/              Utilities (utils, api client)
  types/            TypeScript type definitions
  App.tsx           Root component with router
  main.tsx          Entry point
  index.css         Global styles with Tailwind v4
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Env Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_GROQ_API_KEY=gsk_your-groq-api-key
```
