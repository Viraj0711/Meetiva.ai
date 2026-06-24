# Frontend Core — Audit Report

**Date:** June 24, 2026
**Module:** Frontend Core (App, Router, Config, Styling)
**Files Audited:** `App.tsx`, `main.tsx`, `router.tsx`, `index.css`, `vite.config.ts`, `tailwind.config.js`, `package.json`, `tsconfig.json`, `components.json`

---

## 1. Overview

The frontend is a React 18 SPA built with Vite 7, TypeScript, and Tailwind CSS. It uses Redux Toolkit for state management, React Query for server state, and features a dark-themed cinematic UI with framer-motion animations and recharts for data visualization.

### Tech Stack
- **Framework:** React 18.2 with TypeScript
- **Build Tool:** Vite 7.3
- **Styling:** Tailwind CSS 3.4 with custom design system
- **State:** Redux Toolkit 2.0 + React Query (TanStack Query) 5.17
- **Routing:** React Router DOM 6.21
- **Forms:** React Hook Form 7.49 + Zod 3.22
- **Animation:** Framer Motion 12.38
- **Charts:** Recharts 2.15
- **Testing:** Jest 29.7 + React Testing Library

---

## 2. Application Structure

```
frontend/src/
├── App.tsx                    # Root component
├── main.tsx                   # Entry point
├── router.tsx                 # Route definitions
├── index.css                  # Global styles (Tailwind + custom)
├── components/
│   ├── ui/                    # Reusable UI components
│   ├── layout/                # Layout components
│   ├── common/                # Shared components
│   └── ... (single components)
├── pages/
│   ├── auth/                  # Login + Register
│   ├── home/                  # Role-based dashboard
│   └── ... (individual pages)
├── store/                     # Redux state management
│   ├── slices/                # Reducers
│   └── selectors/             # Derived state
├── services/                  # API clients
├── hooks/                     # Custom React hooks
├── types/                     # TypeScript type definitions
├── utils/                     # Utility functions
├── lib/                       # Third-party wrappers (supabase, utils)
└── __tests__/                 # Frontend tests
```

---

## 3. Root Component (`App.tsx`)

```typescript
const App: React.FC = () => (
  <ErrorBoundary>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
      </QueryClientProvider>
    </Provider>
  </ErrorBoundary>
);
```

✅ **Strengths:**
- Error boundary at the top level
- Redux Provider + React Query client
- Sensible query defaults: stale time 30s, retry 1, no refetch on window focus

---

## 4. Routing (`router.tsx`)

### Route Structure
```
/                        → LandingNew (public)
/login                   → LoginEnhanced (public)
/register                → RegisterEnhanced (public)
/pricing                 → Pricing (public)
/contact                 → Contact (public)
/terms                   → Terms (public)
/privacy                 → Privacy (public)
/dashboard               → Layout (protected)
  /                      → RoleHome (DashboardEnhanced)
  /meetings              → Meetings
  /meetings/:id          → MeetingDetail
  /upload                → Upload
  /processing/:id        → Processing
  /action-items          → ActionItems
  /analytics             → Analytics
  /team-report           → TeamReport
  /teams                 → TeamsAdmin
  /workspace             → Workspace
  /profile               → Profile
  /settings              → Settings
*                        → NotFound (404)
```

### ✅ Strengths
1. **Lazy loading** — All page components use `React.lazy()` with `Suspense` for code splitting
2. **Protected routes** — Dashboard routes wrapped with `ProtectedRoute` component
3. **Clean separation** — Public routes vs authenticated routes
4. **Nested layout** — Dashboard uses `Layout` component (Sidebar + Navbar + Outlet)

### ⚠️ Issues Found
1. **`ProtectedRoute` is duplicated** — Defined both inline in `router.tsx` (local `ProtectedRoute` component) and as a separate `components/ProtectedRoute.tsx` file. The inline version uses `Outlet`, the separate file uses it too but is not imported in the router.
2. **`ToastContainer` is not rendered** — The toast system is set up in the Redux store and `ToastContainer` component exists, but it's never mounted in the app. Toasts will not display.
3. **`ThemeProvider` is not used** — The ThemeProvider component exists but is not included in the app hierarchy.

---

## 5. Styling System

### Tailwind Configuration (`tailwind.config.js`)
- Custom dark theme with HSL CSS variables
- Custom font families: Inter (body), Space Grotesk (display)
- Custom background gradients
- Extensive keyframe animations (float, drift, shimmer, etc.)
- Glass panel utilities (+glass-panel, +fine-grid, +grain-overlay)

### Global CSS (`index.css`)
- Dark-first design (HSL variables default to dark)
- Custom scrollbar styling
- `::selection` styling
- Custom `<select>` component styling
- Utility classes for gradients, glass effects, parallax

### ✅ Strengths
1. Comprehensive design system with CSS variables
2. Dark theme optimized for the UI
3. Custom scrollbar for consistent cross-browser experience
4. Reusable glass panel and grid utilities
5. Rich animation library for micro-interactions

### ⚠️ Issues
1. **`.dark` class variables are identical to `:root` variables** — The `.dark` block in `index.css` duplicates the `:root` block with the same values. Since `:root` already has dark values, the `.dark` block is redundant.
2. **`components.json` references shadcn/ui** — The project uses shadcn/ui conventions but the UI components are custom-built, not from shadcn. This could cause confusion.

---

## 6. Build Configuration

### Vite Config (`vite.config.ts`)
- React plugin with path alias (`@/` → `./src/`)
- Dev server on port 5173 with API proxy (`/api` → backend)
- Production chunk splitting (vendor, redux, query)
- Source maps enabled
- **Missing env validation** — Throws at build time if `VITE_SUPABASE_URL` or `VITE_SUPABASE_ANON_KEY` is missing (✅ good)

### TypeScript Config (`tsconfig.json`)
- Target: ES2020
- Strict mode with all strict flags enabled
- Path alias: `@/*` → `./src/*`
- JSX: react-jsx

### ✅ Strengths
1. Path alias for clean imports
2. API proxy for development
3. Chunk splitting for production builds
4. Strict TypeScript

---

## 7. Dependencies Analysis

### Major Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| react | ^18.2.0 | UI framework |
| @reduxjs/toolkit | ^2.0.1 | State management |
| @tanstack/react-query | ^5.17.9 | Server state + caching |
| framer-motion | ^12.38.0 | Animations |
| axios | ^1.6.5 | HTTP client |
| recharts | ^2.15.4 | Charts |
| react-hook-form | ^7.49.3 | Form management |
| zod | ^3.22.4 | Schema validation |
| date-fns | ^3.2.0 | Date utilities |
| lucide-react | ^0.309.0 | Icons |
| class-variance-authority | ^0.7.0 | Component variants |
| tailwind-merge | ^2.2.0 | Class merging |

### ⚠️ Issues
1. **`axios` is duplicated** — Both root `package.json` and `frontend/package.json` list `axios` as a dependency. This creates two copies in `node_modules`.
2. **`framer-motion` version 12.38 is very recent** — Ensure compatibility with React 18.
3. **`@testing-library/react` 16.3** — This requires React 19. There may be compatibility issues with React 18.2.
   - **Note:** The `peerDependencies` of @testing-library/react@16 require React ^18.0.0 or ^19.0.0, so it should work.

---

## 8. Overall Assessment

**Rating: A- (Very Good)**

The frontend core is well-architected with modern tooling and a comprehensive design system. The component structure is clean and the routing setup follows React best practices.

### Critical Issues
1. **ToastContainer not rendered** — Toast notifications are non-functional
2. **ThemeProvider not used** — Theme switching won't work
3. **Duplicated axios dependency** in root and frontend

### Recommendations
1. Add ToastContainer and ThemeProvider to App.tsx
2. Remove duplicate axios from root package.json
3. Clean up redundant ProtectedRoute in router.tsx
4. Remove duplicate `.dark` CSS block
5. Consider upgrading to React 19 for compatibility with latest testing libraries
