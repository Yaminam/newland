# FounderCentral Web

FounderCentral is a React, TypeScript, Vite, and Supabase web application for startup discovery, investor matching, warm introductions, fundraising intelligence, support operations, and platform administration.

The app supports two primary user groups:

- **Founders**: create and maintain startup listings, upload pitch materials, browse investors, track introductions, and use AI support for fundraising.
- **Investors**: discover startup listings, manage portfolio records, request introductions, configure investor preferences, track market activity, and use investor-type-specific workflows.

---

## Contents

- [Stack](#stack)
- [Local Setup](#local-setup)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Application Architecture](#application-architecture)
- [Routes](#routes)
- [Current Features](#current-features)
- [Authentication and Access Control](#authentication-and-access-control)
- [Supabase Data Model](#supabase-data-model)
- [Backend Functions](#backend-functions)
- [Security and Compliance](#security-and-compliance)
- [Design System](#design-system)
- [Deployment](#deployment)
- [Project Structure](#project-structure)

---

## Stack

| Area | Technology |
| --- | --- |
| Frontend | React 19, TypeScript 5.8 |
| Build | Vite 6 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4, CSS custom properties |
| UI primitives | Radix UI |
| Animation | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Forms and validation | React Hook Form, Zod |
| Notifications | Sonner, Supabase Realtime |
| Backend | Supabase Auth, Postgres, Storage, Realtime |
| Backend functions | Supabase Edge Functions |
| Linting | ESLint 9, TypeScript ESLint, React hooks rules |

---

## Local Setup

Install dependencies:

```bash
npm install
```

Create `.env.local` in the project root and add the required Supabase values. The app imports the Supabase client during startup and will throw if these variables are missing.

Start the dev server:

```bash
npm run dev
```

By default, Vite is configured in [vite.config.ts](./vite.config.ts) to bind to:

```text
http://localhost:5173
```

The configured server uses `strictPort: true`, so if port `5173` is already occupied the dev server exits instead of falling back to another port. You can temporarily run another port with:

```bash
npm run dev -- --port 5174
```

---

## Environment Variables

Frontend values must use the `VITE_` prefix:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
VITE_APP_URL=http://localhost:5173
```

Server-side environment variables (used by Supabase Edge Functions):

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_ANON_KEY=<public-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
```

Security note: never place service-role keys, database passwords, JWT secrets, or private provider keys in `VITE_` variables. `VITE_` values are bundled into browser-accessible code.

---

## Scripts

```bash
npm run dev          # Start Vite dev server
npm run build        # Run TypeScript project build, then Vite production build
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
npm run audit:check  # Run npm audit at high severity threshold
```

---

## Application Architecture

```text
Browser
  -> Vite React SPA
      -> App providers
          -> ThemeContext
          -> AuthContext
          -> NotificationContext
      -> React Router route tree
          -> AuthLayout for public auth pages
          -> DashboardLayout for authenticated app pages
      -> Supabase client
          -> Auth
          -> Postgres tables
          -> Storage buckets
          -> Realtime notifications
      -> Supabase Edge Functions
          -> AI proxy
          -> API key validation
          -> security event logging
          -> CSP report ingestion
```

Important implementation choices:

- Routes are centrally defined in [src/app/routes/routes.tsx](./src/app/routes/routes.tsx).
- Dashboard pages are lazy-loaded with `React.lazy()` and `Suspense`.
- Authentication, profile loading, onboarding state, and access role are owned by `AuthContext`.
- In-app notifications are fetched and subscribed to through `NotificationContext`.
- Most app data is read and written directly through Supabase with RLS expected to enforce ownership and visibility.
- Supabase Edge Functions are used for sensitive workflows such as AI proxying and API key validation.

---

## Routes

### Public and Auth Routes

| Route | Purpose |
| --- | --- |
| `/` | Redirects to `/auth/login` |
| `/auth/login` | Email/password login |
| `/auth/signup` | Account registration |
| `/auth/forgot-password` | Password reset request |
| `/auth/reset-password` | Password update after recovery |
| `/auth/verify-email` | Email verification flow |
| `/verify-email` | Standalone email verification route |

### Protected Routes

| Route | Purpose |
| --- | --- |
| `/onboarding` | Role and profile onboarding for new users |
| `/dashboard` | Role-aware dashboard home |
| `/dashboard/marketplace` | Startup discovery marketplace |
| `/dashboard/introductions` | Warm introduction tracking |
| `/dashboard/portfolio` | Investor portfolio management |
| `/dashboard/investor-profile` | Investor profile and investment preferences |
| `/dashboard/my-listing` | Founder startup listing and pitch deck management |
| `/dashboard/browse-investors` | Investor discovery directory |
| `/dashboard/ask-ai` | AI chat assistant |
| `/dashboard/news-feed` | Startup and funding news |
| `/dashboard/trending` | Trending startup feed |
| `/dashboard/funding-tracker` | Funding rounds tracker |
| `/dashboard/events` | Ecosystem events |
| `/dashboard/settings` | Account, profile, privacy, notification, appearance, and billing settings |
| `/dashboard/api-keys` | API key creation, rotation, revocation, and copy workflow |
| `/dashboard/partnership-intros` | Corporate venture partnership introductions |
| `/dashboard/co-invest` | Family office co-investment opportunities |
| `/help` | Searchable help center |
| `/contact` | Support request and bug report forms |
| `/admin` | Admin dashboard guarded by `access_role = admin` |

### Legal and Compliance Routes

| Route | Purpose |
| --- | --- |
| `/privacy-policy` | Privacy policy |
| `/terms-of-service` | Terms of service |
| `/dpa` | Data processing addendum |
| `/ai-transparency` | AI transparency information |
| `/data-governance` | Data governance policy |
| `/api-usage-policy` | API usage policy |
| `/gdpr` | GDPR information and data rights |
| `/soc2-readiness` | SOC 2 readiness information |
| `/prompt-storage-policy` | Prompt storage policy |

---

## Current Features

### Authentication

- Email/password signup and login through Supabase Auth.
- Email verification enforcement.
- Password reset flow.
- Google OAuth entry point.
- Session persistence configured through `sessionStorage`.
- Idle-session and auth security checks in `authSecurity.ts`.
- Security event logging for login, signup, frontend errors, and unhandled promise rejections.

### Onboarding

- Multi-step onboarding for investors and founders.
- Investor types: angel, venture capital, bank, NBFC, family office, corporate venture.
- Founder types: active startup and idea-stage founder.
- Role-specific profile data capture.
- Investor preference capture for sectors, stages, geographies, check size, thesis, lending products, innovation focus, and partnership interests.
- Founder profile capture for company details, sector, stage, ARR, growth, raise amount, idea details, target market, support needs, and pitch context.
- Partial onboarding persistence and final onboarding completion flags.

### Dashboard Home

- Role-aware dashboard experience for founders and investors.
- KPI cards and overview sections.
- Market, funding, startup, and introduction summaries.
- Supabase-backed metrics and charts using Recharts.

### Startup Marketplace

- Startup browsing and filtering.
- Startup profile cards and detail views.
- Founder bookmark support for investors.
- Introduction request creation from startup discovery flows.
- Uses founder, startup application, bookmark, and introduction data.

### Browse Investors

- Directory combining registered platform investors and scraped investor data.
- Search and filters for investor discovery.
- Investor profile cards with firm, type, stage, sector, location, verification, and response data.
- Founder-to-investor introduction request workflow.

### Warm Introductions

- Shared introduction workflow for founders and investors.
- Incoming and outgoing request views.
- Status tracking for pending, accepted, rejected, and video-uploaded states.
- Founder and investor context loaded from Supabase profile tables.

### Founder Listing

- Founder-owned listing management.
- Company profile, sector, stage, traction, fundraising, links, team, and bio fields.
- Avatar upload to Supabase Storage.
- Pitch deck upload and signed/public URL handling.
- Analytics-style counts for views, bookmarks, and introduction activity.

### Investor Profile

- Investor-owned profile editing.
- Firm/company details, bio, LinkedIn URL, avatar upload, and investment preferences.
- Preference editing for sectors, stages, geographies, check size, and thesis.
- Profile data used in founder-facing investor discovery.

### Portfolio

- Investor portfolio item management.
- Investment records scoped to the current investor.
- Company, sector, stage, investment amount, investment date, status, and notes fields.
- Portfolio summaries and charted views.

### AI Chat

- Authenticated AI assistant page.
- Modes for market intelligence and fundraising coaching.
- Client requests are sent directly to a Supabase Edge Function.
- The Edge Function validates the Supabase session, rate-limits by IP and user, and validates input with Zod.

### News Feed

- Curated startup and investing news feed.
- Category, sector, recency, and featured/hot article presentation.
- Uses `news_articles`.

### Trending Startups

- Ranked startup discovery experience.
- Sector-aware browsing.
- Public startup and market-momentum style data presentation.

### Funding Tracker

- Funding round list and charts.
- Filters for sector and round type.
- Uses `funding_rounds`.

### Events

- Ecosystem event browsing.
- Event cards with date, location, type, host, and description.
- RSVP-oriented workflow backed by event data.

### API Keys

- User-owned API key management.
- Generate new keys client-side.
- Store only hashed keys in Supabase.
- Show newly issued plain-text key once.
- Rotate keys by issuing a replacement and revoking the old key.
- Revoke inactive or exposed keys.
- Validate keys server-side through a Supabase Edge Function.

### Support and Feedback

- Authenticated contact page.
- Support ticket submission to `support_tickets`.
- Bug report submission with severity, reproduction details, expected/actual behavior, and optional screenshot upload.
- In-app feedback widget backed by the `feedback` table.
- Admin dashboard surfaces support and feedback trends.

### Admin Dashboard

- Guarded by `RoleGuard` and `access_role = admin`.
- Platform stats for total users, founders, investors, open tickets, and feedback sentiment.
- Recent signup review.
- Open support ticket queue.
- Recent feedback list.
- Resolve support tickets from the admin UI.

### Help Center

- Searchable help categories.
- Getting started, account and billing, founders, investors, and troubleshooting guidance.
- Links users to support when self-service content is not enough.

### Legal and Trust Pages

- Privacy, terms, DPA, GDPR, SOC 2 readiness, data governance, AI transparency, API usage, and prompt storage pages.
- Intended to support trust, enterprise readiness, and policy communication.

---

## Authentication and Access Control

Auth state lives in [src/app/context/AuthContext.tsx](./src/app/context/AuthContext.tsx).

The context exposes:

- `user`
- `profile`
- `accessRole`
- `pendingVerificationEmail`
- `isAuthenticated`
- `onboardingCompleted`
- `isLoading`
- `login`
- `loginWithGoogle`
- `register`
- `logout`
- `completeOnboarding`
- `updateProfile`
- `refreshProfile`

Route protection is handled by:

- [ProtectedRoute](./src/app/components/ProtectedRoute.tsx): requires auth and optionally requires onboarding completion.
- [RoleGuard](./src/app/components/RoleGuard.tsx): restricts pages by `access_role`, currently used for `/admin`.

Dashboard navigation is role-aware:

- Investors see startup discovery, portfolio, investor profile, introductions, AI, API keys, market intelligence, support, and settings.
- Corporate venture investors additionally see partnership introductions.
- Family office investors additionally see co-investment opportunities.
- Active founders see their listing, startup marketplace, investor discovery, introductions, events, AI, API keys, support, and settings.
- Idea-stage founders see listing, investor discovery, market intelligence, introductions, events, AI, API keys, support, and settings.

---

## Supabase Data Model

Tables referenced by the application and migrations include:

| Table | Purpose |
| --- | --- |
| `profiles` | Core user profile, role, access role, onboarding state |
| `investor_profiles` | Investor preferences and thesis data |
| `founder_profiles` | Founder/startup profile data |
| `startup_applications` | Startup listing records used across marketplace/listing flows |
| `scraped_investors` | External/curated investor records |
| `introductions` | Founder-investor introduction requests |
| `founder_bookmarks` | Investor bookmarks for founder/startup profiles |
| `portfolio_items` | Investor portfolio entries |
| `notifications` | In-app notification records |
| `news_articles` | Curated/scraped startup and investment news |
| `funding_rounds` | Funding event records |
| `trending_startups` | Ranked startup momentum data |
| `events` | Ecosystem events |
| `event_rsvps` | Event registration records |
| `api_keys` | Hashed API keys, prefixes, status, expiry, and last-used metadata |
| `support_tickets` | Contact/support requests |
| `feedback` | In-app user feedback |
| `bug_reports` | Bug reports with severity and optional screenshot metadata |

Supabase migrations live in [supabase/migrations](./supabase/migrations).

Current migration themes:

- OAuth provider support.
- Ownership-focused RLS enforcement.
- RBAC access roles.
- API key storage and RLS refinements.
- Support tickets.
- Feedback.
- Bug reports.

---

## Backend Functions

Server-side logic is handled by Supabase Edge Functions.

| Function | Purpose |
| --- | --- |
| AI chat | Authenticates Supabase bearer token, rate-limits requests, validates payloads, and processes AI chat requests |
| API key validation | Validates incoming API keys against hashed database records and returns user/key metadata |
| Security event | Receives frontend security events and logs unusual traffic patterns |
| CSP report | Receives browser CSP violation reports |

---

## Security and Compliance

Implemented security controls include:

- Supabase Auth with verified email checks.
- Session storage instead of local storage for Supabase auth persistence.
- Service-role key separation from browser environment variables.
- Input sanitization helpers in [src/app/lib/inputSecurity.ts](./src/app/lib/inputSecurity.ts).
- API key hashing in [src/app/lib/apiKeyUtils.ts](./src/app/lib/apiKeyUtils.ts).
- Server-side rate limiting.
- CSP report ingestion.
- Frontend security event logging with `sendBeacon` fallback.
- Security headers configured on the hosting server:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - restricted `Permissions-Policy`
  - HSTS
  - Content Security Policy

Supporting docs:

- [docs/auth-security.md](./docs/auth-security.md)
- [docs/secrets-management.md](./docs/secrets-management.md)
- [docs/secure-deployment.md](./docs/secure-deployment.md)
- [docs/abuse-protection.md](./docs/abuse-protection.md)
- [docs/soc2-readiness.md](./docs/soc2-readiness.md)

---

## Design System

Global styles and tokens live in [src/styles/index.css](./src/styles/index.css).

The UI uses:

- CSS custom properties for color, spacing, surfaces, borders, and text.
- Tailwind utility classes for component layout and responsive behavior.
- Reusable UI primitives under [src/app/components/ui](./src/app/components/ui).
- Radix primitives for accessible interaction patterns.
- Framer Motion for panel, card, and route-level animation.
- Lucide icons for navigation and action affordances.
- Sonner for toast feedback.

Shared application components include:

- `FounderCentralLogo`
- `ThemeToggle`
- `NotificationCenter`
- `CookieConsentBanner`
- `FeedbackWidget`
- `ErrorBoundary`
- `RouteErrorPage`
- `ProtectedRoute`
- `RoleGuard`

---

## Deployment

The app is deployed as a static SPA on Hostinger with Supabase Edge Functions handling server-side logic.

The hosting server should be configured to:

- Serve all non-API routes from `index.html` for client-side routing.
- Apply security headers for all responses.

Production build:

```bash
npm run build
```

Preview production output locally:

```bash
npm run preview
```

Required deployment environment variables:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_URL`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## Project Structure

```text
capital-connect-web/
  docs/
  public/
  src/
    App.tsx
    main.tsx
    styles/
      index.css
    app/
      components/
      context/
      hooks/
      layouts/
      lib/
      pages/
        admin/
        auth/
        dashboard/
        help/
        legal/
        onboarding/
        support/
      routes/
  supabase/
    migrations/
  eslint.config.js
  index.html
  package.json
  tsconfig.app.json
  tsconfig.json
  tsconfig.node.json
  vite.config.ts
```

---

## Current Development Notes

- `.env.local` must contain valid Supabase frontend variables before the app can render.
- `vite.config.ts` currently uses `strictPort: true` on port `5173`.
- The README describes the codebase as currently structured. Before release, run `npm run lint` and `npm run build` and address any TypeScript or lint errors reported by the toolchain.

---

## License

Proprietary. FounderCentral. All rights reserved.
