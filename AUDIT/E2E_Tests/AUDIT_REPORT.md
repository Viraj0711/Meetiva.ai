# E2E Tests — Audit Report

**Date:** June 24, 2026
**Module:** End-to-End Tests (Playwright)
**Files Audited:** `e2e/auth.spec.ts`, `e2e/landing.spec.ts`, `e2e/pages.spec.ts`, `playwright.config.ts`

---

## 1. Playwright Configuration (`playwright.config.ts`)

### Settings
| Setting | Value |
|---------|-------|
| testDir | ./e2e |
| Parallel | `fullyParallel: true` |
| Retries | 2 (CI) / 0 (local) |
| Workers | 1 (CI) / undefined (local) |
| Reporter | HTML |
| baseURL | http://localhost:5174 |
| Trace | on-first-retry |
| Screenshot | only-on-failure |
| Video | retain-on-failure |

### Browser Coverage
| Project | Device |
|---------|--------|
| Chromium | Desktop Chrome |
| Firefox | Desktop Firefox |
| WebKit | Desktop Safari |
| Mobile Chrome | Pixel 5 |
| Mobile Safari | iPhone 12 |

### Web Server
```javascript
webServer: {
  command: 'cd frontend && npm run dev',
  url: 'http://localhost:5174',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000,
}
```

### ✅ Strengths
1. **Cross-browser testing** — Chromium, Firefox, WebKit, mobile
2. **CI-optimized** — Retries, single worker, forbid test.only
3. **Evidence capture** — Screenshots on failure, video on retry
4. **Auto-start dev server** — No manual setup needed
5. **Reuse existing server** — Faster local development

### ⚠️ Issues
1. **Dev server port mismatch** — The frontend vite config uses port 5173, but Playwright expects 5174. The webServer command will start on 5173 but Playwright polls 5174.
2. **No global setup/teardown** — No database seeding or auth token setup before tests.
3. **Long timeout (120s)** for webServer is reasonable but could be shortened.

---

## 2. Auth Tests (`e2e/auth.spec.ts`)

### Login Tests
| Test | Expected |
|------|----------|
| Navigate to login | URL /login, h1 contains "Welcome Back" |
| Invalid email validation | Shows "valid email" error |
| Short password validation | Shows "at least 8 characters" error |
| Toggle password visibility | Input type changes from password to text |
| Navigate to register | URL /register, h1 contains "Create Account" |

### Registration Tests
| Test | Expected |
|------|----------|
| Display registration form | Placeholders visible |
| Validate name field | Shows "at least 2 characters" error |
| Password strength meter | Shows "Password Strength" |
| Validate password confirmation | Shows "Passwords do not match" |
| Require terms acceptance | Shows "accept the Terms" error |

### ⚠️ Issues
1. **Text mismatches** — Tests expect specific text that doesn't match the actual UI:
   - "Welcome Back" → Actual: "Welcome back to the meeting engine." ❌
   - "Create Account" → Actual: "Create your account" ❌
   - "John Doe" placeholder → Actual: "Your name" ❌
   - "you@example.com" placeholder → Actual: "you@company.com" ❌
   - "Sign up" link → Actual: "Create an account" text ❌
   - "Password Strength" → The register page doesn't show this ❌
   - "accept the Terms" → No terms checkbox on register page ❌

2. **These tests will ALL fail** because the expected text doesn't match the actual UI. The tests were written for a previous version of the pages.

3. **No API testing** — All tests are UI-only. They don't test the actual auth flow (login with real credentials, verify redirect to dashboard).

---

## 3. Landing Page Tests (`e2e/landing.spec.ts`)

| Test | Expected |
|------|----------|
| Load landing page | h1 contains "Transform Your Meetings" |
| Navigate to pricing | URL /pricing |
| Navigate to contact | URL /contact, h1 "Get in Touch" |
| FAQ accordion | Click FAQ, content expands |

### ⚠️ Issues
1. **"Transform Your Meetings"** → Actual: "Meetings become structured momentum." ❌
2. **"Simple, Transparent Pricing"** → Actual: "Plans built for premium meeting momentum." ❌
3. **FAQ section doesn't exist** on landing page — The test expects an FAQ accordion that isn't present ❌
4. **Contact page h1** → Actual: "Get in Touch" matches ✅

---

## 4. Pages Tests (`e2e/pages.spec.ts`)

### Pricing Tests
| Test | Expected |
|------|----------|
| Display all tiers | Starter, Professional, Enterprise |
| Monthly pricing | $29, $99 visible |
| Highlighted plan | "Most Popular" badge |
| CTA buttons | 3 buttons |

### ⚠️ Issues
1. **"Professional"** → Actual: "Growth" ❌
2. **"$99"** → The actual pricing has $59 for Growth ❌
3. **Plan features don't match** — The tests expect specific content that differs from actual

### Contact Tests
| Test | Expected |
|------|----------|
| Display contact form | Placeholders visible |
| Contact information | Email and phone visible |
| Validate email | Stays on /contact for invalid email |

### ⚠️ Issues
1. **Placeholder mismatches** — "Your Name" → Actual: "Your name" (case), "your.email@example.com" → Actual: "your.email@company.com" ❌
2. **Email validation test** — Checks page URL remains /contact, but the form has no client-side validation and no backend. The test may pass but for the wrong reason.

### Legal Pages Tests
| Test | Expected |
|------|----------|
| Navigate to Terms | h1 "Terms of Service" |
| Navigate to Privacy | h1 "Privacy Policy" |
| Last updated date | "Last updated" visible |

### ⚠️ Issues
1. **Terms h1** → Actual: "Terms that match the product..." ❌
2. **Privacy h1** → Actual: "Privacy built for a product..." ❌

---

## 5. Overall E2E Test Assessment

**Rating: D (Poor — Tests are broken)**

### Summary
- **13 total tests** across 3 spec files
- **Most tests (~11/13) will fail** due to text mismatches with the updated UI
- The tests were written for a previous version of the pages

### ✅ What's Working
- Cross-browser configuration is solid
- Test infrastructure is well-configured
- Some basic tests pass (Contact page heading ✅)

### ⚠️ Critical Issues

| # | Issue | Severity |
|---|-------|----------|
| 1 | **11 of 13 tests have incorrect selectors/text** | 🔴 |
| 2 | **FAQ section doesn't exist** on landing page | 🔴 |
| 3 | **No terms checkbox** on register page | 🔴 |
| 4 | **No API integration tests** — All tests are UI-only | 🟡 |
| 5 | **No authenticated flow tests** | 🟡 |
| 6 | **Port mismatch** (5173 vs 5174) | 🟡 |

### Recommendations
1. **Rewrite all E2E tests** to match the current UI
2. **Test actual user flows** — Login → Upload meeting → View summary → Export
3. **Add auth setup** — Create test user and use auth token for authenticated flows
4. **Test RBAC** — Verify managers see team data, members see only their own
5. **Fix port mismatch** between vite config and playwright config
6. **Add test data setup/teardown** in global setup
