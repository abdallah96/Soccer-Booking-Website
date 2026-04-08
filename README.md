# Petit Camp

Web app for booking the Petit Camp football pitch in Thiès, Senegal: live availability, tiered pricing, payments (Wave, Orange Money, cash), and an operator dashboard backed by Supabase.

<!-- ADD SCREENSHOT OR GIF HERE -->

## Live demo

_Add your production URL here._

## Tech stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, Supabase (PostgreSQL + Storage), Zustand, React Hook Form, Zod, jose (JWT), bcryptjs, @react-pdf/renderer, Recharts, Vercel Analytics.

## Key features

- **Auth model:** JWT sessions in cookies (`auth-token`), with `requireAuth` / `requireAdmin` / `requireSuperAdmin` guards on Route Handlers and roles stored in Supabase (`user`, `admin`, `super_admin`).
- **Guest checkout:** Bookings without a prior login create or attach a `users` row from a sanitized phone number (hashed passwords for auto-provisioned accounts).
- **Pricing:** Per-field hourly rates plus optional `pricing_rules` (weekday / weekend / all days, hour ranges) layered with day vs. night multipliers in shared pricing utilities.
- **Availability:** Week-level open/closed windows, admin-blocked slots, and calendar views with multi-month booking-density hints for choosing dates.
- **Discounts & loyalty:** Server-side discount code validation; database support for loyalty-style pricing (see migrations under `src/lib/db`).
- **Subscriptions & jobs:** User field subscriptions with admin flows; cron-style HTTP routes for expiring unpaid bookings and processing subscriptions, gated by a shared secret header.
- **Receipts & admin:** PDF booking receipts via `@react-pdf/renderer`; admin UI with Recharts summaries, booking/user/field management, review moderation (including replies), CSV export, and image uploads for fields.

## Getting started

```bash
git clone <repository-url>
cd petit-camp
npm install
```

Create `.env.local` in the project root (see `.env.example` for names). At minimum you need Supabase URL and keys, a JWT secret for production, and (if you call the cron routes) a shared cron secret.

**Environment variable names:**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `JWT_SECRET` (required in production; optional `NEXT_PUBLIC_JWT_SECRET` exists only as a non-recommended fallback in code)
- `CRON_SECRET` (for `/api/bookings/expire` and `/api/subscriptions/process`)
- `NEXT_PUBLIC_LOGO_URL` (optional branding)

**Scripts only (optional):** `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_NAME`, `SUPER_ADMIN_PASSWORD`, `SUPER_ADMIN_PHONE`, `UPDATE_PASSWORD` — used by `npm run create-super-admin`.

Apply the SQL schema and policies in `src/lib/db` to your Supabase project (or use `npm run migrate` / `npm run seed` where applicable). Then:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

**Other npm scripts:** `npm run build`, `npm start`, `npm run lint`, `npm run seed`, `npm run migrate`, `npm run create-super-admin`, `npm run clean-all-data`.

## Project structure

- **`src/app`** — Next.js App Router pages (`auth`, `fields`, `admin`, `my-bookings`, etc.) and `api` Route Handlers.
- **`src/components`** — React UI (layout, fields, forms, shared primitives).
- **`src/lib`** — Supabase clients, auth middleware, JWT helpers, pricing/sanitization, stores, Zustand state, and SQL migration assets under `lib/db`.
- **`scripts`** — One-off TypeScript scripts (seed, migrate, super-admin, storage checks).
- **`public`** — Static assets served as-is.
