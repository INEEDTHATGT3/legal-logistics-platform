# NyaySetu — Legal Consultation & Logistics Platform

A unified, multi-sided Next.js App Router platform. Clients book virtual
consultations with lawyers; the same account also requests physical document
delivery and tracks it across the logistics network. One Supabase database
backs all three roles — see `PROJECT_SPEC.md`.

Stack: Next.js 16 (App Router, Proxy), React 19, Supabase (Postgres + Auth +
RLS), Tailwind v4, shadcn/ui on Base UI.

---

## Setup

### 1. Install

```bash
pnpm install
```

### 2. Environment

`.env.local` needs your Supabase project's URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### 3. Database — required

Open the Supabase dashboard → **SQL Editor** → **New query**, paste the whole
of [`supabase/schema.sql`](supabase/schema.sql), and run it.

The script is idempotent, so it doubles as the migration for a project that
already has an earlier version of the schema. It creates the four tables, the
row-level security policies, the `handle_new_user` sign-up trigger, and
backfills a `lawyer_profiles` row for any lawyer missing one.

> **Table names are lower case.** Postgres folds unquoted identifiers, so
> `CREATE TABLE Users` really creates `users`, and PostgREST — which is
> case-sensitive — only answers to `users`. Every query in the app uses the
> lower-case name.

### 4. Verify

```bash
pnpm verify:db
```

Checks that every table, column and foreign-key embed the app relies on
actually resolves, and that RLS hides data from signed-out callers. To also
exercise the write paths (booking, delivery request, case notes, rate change,
tracking updates) plus the negative RLS cases:

```bash
pnpm verify:db --mutations
```

That flag creates throwaway `verify-*@example.com` accounts, so run it against
a development project. It needs "Confirm email" turned off under
**Authentication → Providers → Email**. Add an admin login to cover the
control panel too:

```bash
VERIFY_ADMIN_EMAIL=admin@demo.com VERIFY_ADMIN_PASSWORD=... pnpm verify:db --mutations
```

### 5. Run

```bash
pnpm dev
```

---

## Roles

Sign-up at `/signup` offers **client** and **lawyer**. Admin is deliberately
not self-serve — the database trigger downgrades any other requested role to
`client`. Promote an account by hand:

```sql
update public.users set role = 'admin' where email = 'you@example.com';
```

| Role     | Route               | Can do                                                              |
| -------- | ------------------- | ------------------------------------------------------------------- |
| `client` | `/dashboard/client` | Browse and search the lawyer directory, book a slot, request a document delivery, watch live tracking |
| `lawyer` | `/dashboard/lawyer` | See booked consultations, close or reopen them, write private case notes, set hourly rate and specialty |
| `admin`  | `/dashboard/admin`  | See every delivery on the network and move its `tracking_status`     |

`/` redirects to the dashboard for your role. Opening another role's dashboard
redirects you back to your own — the guard lives in `lib/auth.ts`.

---

## Layout

```
app/
  actions.ts              server actions for every mutation
  auth/actions.ts         sign in / sign up / sign out
  auth/callback/route.ts  email-confirmation code exchange
  login/, signup/         auth pages (server page + client form)
  dashboard/
    layout.tsx            sidebar + topbar shell, loads the current user
    error.tsx             shown when the schema has not been applied
    client/, lawyer/, admin/    page.tsx fetches, *-view.tsx renders
lib/
  auth.ts                 getCurrentUser / requireRole / getActionContext
  supabase/               server, browser and proxy clients
  types.ts                row types, joined shapes, display constants
  format.ts               INR, date and initials formatting
proxy.ts                  session refresh (Next 16's renamed middleware)
supabase/schema.sql       tables, RLS, trigger — the single source of truth
scripts/verify-backend.mjs
```

### Conventions

- **Authorization is server-side.** `proxy.ts` only refreshes the session
  cookie; the real check is `lib/auth.ts`, which calls `auth.getUser()` (the
  auth server verifies the token) and reads the role from `public.users`.
  RLS in Postgres is the last line of defence.
- **Server actions return `ActionResult`, they don't throw.** A rejected
  mutation renders inline in the form instead of Next's error overlay.
- **Updates use `.select()` to confirm a row changed**, so a silent zero-row
  write (missing profile, RLS denial) reports failure rather than success.
