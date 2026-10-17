# BOND

Homepage, login, customer and vendor registration, email verification, role-based dashboards, and the **marketplace**: verified shops, gift / surprise / event-service ordering, vendor tools and admin approvals for **BOND**.
Built with Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS v4, Supabase Auth/Postgres/Storage, React Hook Form and Zod.

> Payments run in **test mode** — no money moves until a payment provider (e.g. PayMongo) is connected. Homepage events, plans, team members and contact details are still demo or placeholder content.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
npm run dev                  # http://localhost:3000
```

The app runs without Supabase keys: every page renders, forms validate, and auth actions show a "Supabase isn't configured" notice instead of failing.

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build (also type-checks and validates prerendering) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check only (run `npx next typegen` first on a fresh clone) |
| `npm run admin:create` | Create an admin account (or promote an existing one) — prompts for a hidden password |

## Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | browser + server | Project URL (Supabase → Project Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | browser + server | `anon` key, or the newer `publishable` key. Safe to expose — RLS limits it. |
| `SUPABASE_SERVICE_ROLE_KEY` | **server only** | Uploads vendor documents to the private bucket. Bypasses RLS. Never prefix with `NEXT_PUBLIC_`, never commit, never log. |
| `NEXT_PUBLIC_SITE_URL` | browser + server | Base URL used in email links. `http://localhost:3000` locally, your domain in production. |
| `NEXT_PUBLIC_ENABLE_PASSWORD_RECOVERY` | browser + server | `false` (default) keeps forgot/reset password as a **static preview** — nothing is sent. Set `true` once SMTP is configured. |

`.env.local` is git-ignored. `.env.example` lists names only.

## Setting up Supabase

Full walkthrough: **[docs/supabase-setup.md](docs/supabase-setup.md)** — run the four SQL migrations (`20261016000000_marketplace.sql` adds shops, listings and orders; `20261017000000_site_activity.sql` adds the visitor log), configure auth settings and redirect URLs, and paste the email templates that include the 6-digit code.

## Deploying to Vercel

Checklist and domain setup: **[docs/deployment.md](docs/deployment.md)**.

## Routes

| Route | Description |
| --- | --- |
| `/` | Homepage (hero, demo events, about, customer/vendor cards, pricing, FAQ, contact) |
| `/login` | Email + password, show/hide password, "keep me signed in" |
| `/signup` | Choose Customer or Vendor |
| `/signup/customer` | Personal info → credentials → email verification |
| `/signup/vendor` | Personal info → documents (selfie, government ID, proof of business) → credentials → verification → application status |
| `/verify-email` | Enter the 6-digit code, resend with cooldown |
| `/forgot-password`, `/reset-password` | Email → code → new password (static preview until enabled) |
| `/dashboard` | Sends each user to the dashboard for their role |
| `/dashboard/customer` | Customer home: start a gift / surprise / event order, recent orders, popular shops |
| `/shops`, `/shops/[slug]`, `/shops/[slug]/items/[id]` | Public directory of verified shops, each shop's gifts / surprises / services and reviews, item pages |
| `/order/gift` | Gift flow: choose a store → cart → checkout → pay |
| `/order/surprise` | Surprise flow: date, time & recipient → choose a surprise → review → pay |
| `/order/event` | Event flow: type → date & place → package or customized checklist → review → pay |
| `/cart`, `/checkout` | Gift cart (one shop per cart) and delivery details |
| `/orders`, `/orders/[id]` | My orders; tracking, cancel, confirm received, report a problem, feedback |
| `/orders/[id]/pay`, `/bookings/[id]/pay` | Test-mode payment (GCash, Maya, card) |
| `/bookings/[id]` | Event booking: each organizer's part, appointment request |
| `/dashboard/vendor` | Application status until approved; then overview with setup checklist |
| `/dashboard/vendor/shop` | Shop settings (logo, delivery fee, open/closed) |
| `/dashboard/vendor/products`, `/services` (+ `/new`, `/[id]`) | Listings with approval status, search, hide/show, delete |
| `/dashboard/vendor/orders`, `/orders/[id]` | Orders by type; move each one along, decline with a reason |
| `/dashboard/vendor/sales`, `/reviews`, `/marketing` | Held vs. released payments, ratings, shareable shop link |
| `/dashboard/admin/listings` | Admin: approve or reject products and services |
| `/dashboard/admin/orders`, `/reports` | Admin: every order; resolve reported problems (refund or release) |
| `/dashboard/admin/visitors` | Admin: who visits the site (device, phone model, browser, approximate location, how often) and every sign-in attempt |
| `/api/track` | Page-view beacon used by the visitor tracker (same-site only, rate limited) |
| `/dashboard/admin` | Admin overview: member and application stats, items waiting for review |
| `/dashboard/admin/vendors` | Admin: vendor application queue by status |
| `/dashboard/admin/vendors/[id]` | Admin: review documents, approve / request resubmission / reject |
| `/dashboard/admin/users` | Admin: user directory with search, role filter and paging |
| `/dashboard/admin/profile` | Admin: your own account details |
| `/auth/confirm` | Handles links from Supabase emails |
| `/api/auth/register/{customer,vendor}` | Registration endpoints (multipart, upload progress) |
| `/privacy`, `/terms` | Placeholder legal pages |

## Project structure

```
app/                     routes, layouts, route handlers
components/
  auth/                  AuthShell, LoginForm, PasswordInput, RoleSelection, RegistrationStepper,
                         Customer/VendorRegistrationForm, DocumentUpload, OtpInput, VerificationStatus,
                         ForgotPasswordFlow, ResetPasswordForm
  home/                  HeroSection (mascot), FeaturedEvents, AboutSection, PricingSection, FaqSection, ContactSection, HomeEnterEffects
  dashboard/             DashboardHeader, AccountMenu, SignOutButton, CustomerHome, VendorHome
  layout/                Navbar, Footer, NavAuthActions, LegalPage
  ui/                    Button, Field/Input, Alert/ErrorMessage, LoadingState, Spinner, Reveal, Toaster
lib/
  supabase/              client (browser), server, admin (service role), proxy (session refresh)
  auth/                  server actions, registration service, session/DAL, error mapping
  validations/           Zod schemas shared by browser and server
  security/              rate limiting, origin checks, file signature validation
  uploads/               browser-side image compression and upload with progress
  config/                site copy, feature flags, password policy, upload limits
  data/                  demo events, FAQ, sample plans (placeholders)
types/                   shared TypeScript types
supabase/migrations/     tables, trigger, RLS, storage bucket and policies
proxy.ts                 Next.js 16 "proxy" (formerly middleware)
```

## Where to change things

- **Copy, contact details, social links** — `lib/config/site.ts`
- **Demo events / FAQ / pricing** — `lib/data/`
- **Minimum age, customer ID upload (`off` / `optional` / `required`), resend cooldown** — `lib/config/features.ts`
- **Password rules** — `passwordPolicy` in `lib/config/features.ts` (match them in Supabase Auth settings)
- **Upload limits and accepted types** — `lib/config/uploads.ts` (and the bucket limit in the storage migration)
- **Hero mascot** — `public/brand/hero-mascot.png` (a trimmed copy of `Hero_Mascot.png`). To change it, replace that file with any transparent PNG and rebuild.
- **Fonts** — the design uses *Blauer Nue* (commercial). It's substituted with *Outfit* in `app/layout.tsx`; swap in Blauer Nue with `next/font/local` once you have a licence.

## Motion, responsiveness and caching

- **Scroll reveal** — wrap any block in `<Reveal>` (`components/ui/reveal.tsx`) to fade it in the first time it scrolls into view. Pass `delay` to stagger a row of cards. Content is never hidden when JavaScript is off, and reduced-motion users get no animation.
- **Hero entrance** — plays once per browser tab. Coming back to the homepage (or reloading in the same tab) shows the hero instantly, already scrolled to the top.
- **Login/logout feedback** — the server sets a short-lived `bond-flash` cookie (`lib/flash.ts`) and `components/ui/toaster.tsx` turns it into a toast on the next page. Client code can call `toast({ tone, title, message })`.
- **Breakpoints tested** — 360px Android/Huawei, 375px iPhone SE, 393px iPhone, 768px iPad, 1024px tablet landscape/small laptop, 1366px laptop, 1920px and 2560px monitors (the UI scales up slightly from 1920px). Inputs use 16px text on phones so iOS doesn't zoom in.
- **Caching** — images are statically imported, so their URLs are content-hashed and served `immutable` (the browser never re-downloads them). The mascot goes out as a ~46 KB AVIF/WebP sized for the screen instead of the 612 KB PNG. The homepage is a prerendered static shell, links prefetch, and visited pages stay alive in memory, so going back is instant.

## Security notes

- Passwords are handled only by Supabase Auth; nothing in this app stores them.
- Login cookies are `httpOnly` (and `Secure` in production), so page scripts can't read or steal a session. Authenticated pages are sent `Cache-Control: private, no-store`.
- Admins are created only with `npm run admin:create` (server-side, service role). Nobody — not even an admin — can change a role through the public API.
- The role is assigned by a database trigger. Sign-up can request `customer` or `vendor` only; `admin` is granted manually in SQL. Users cannot change their role (column-level grants + RLS).
- Vendors cannot change their own review status; only admins can (RLS).
- Documents go to a **private** bucket under `<user id>/…`, uploaded by the server after checking each file's real type from its bytes. Users can read only their own folder.
- Every page re-checks the session on the server; the proxy only does optimistic redirects.
- Registration endpoints reject cross-site requests. Server actions get Next.js's built-in origin check.
- Rate limiting: Supabase Auth's server-side limits are the real enforcement. The in-memory limiter in `lib/security/rate-limit.ts` is an extra per-instance layer; swap it for Redis/Upstash if you need a shared limit.
- Auth errors are generic where they could reveal whether an account exists.
- Marketplace: customers can't write orders directly — orders are placed and moved along only through database functions that check who's calling and what state the order is in. Payment confirmation runs only with the service role (server-side). Vendors see only their own shop's orders; unverified vendors can't create shops or listings; nothing is public until an admin approves it, and any vendor edit sends it back for review. Shop logos and listing photos are uploaded by the server after checking the file's real type.
