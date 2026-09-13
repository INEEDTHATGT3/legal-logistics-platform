# NyaySetu — Legal Consultation & Logistics (Demo Build)

An interactive prototype showing how lawyer discovery, virtual consultations,
and physical document logistics fit into one coordinated experience.

This is a **presentation build**. Everything runs in the browser: the data is
seeded, the personas are switchable without signing in, and there is no
database, no authentication service, and no backend of any kind. It builds to
plain static files.

Stack: Next.js 16 (App Router, static export), React 19, Tailwind v4,
shadcn/ui on Base UI.

> Nothing here is real legal advice, a real courier network, or real customer
> data. Every name, address, and case note is synthetic.

---

## Run it

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 — no `.env` file, no credentials.

To run the exact bundle that gets deployed:

```bash
pnpm preview
```

That builds the static export into `out/` and serves it at http://localhost:3000.
Useful before a pitch: it works with the network unplugged.

---

## The demo story

1. Land on the entry screen and pick a persona.
2. **Client** — browse the advocate directory, search and filter it.
3. Book a consultation from a lawyer card.
4. Request a document delivery and watch the tracking timeline appear.
5. Switch to **Admin** — move that delivery down the timeline.
6. Switch back to **Client** — the tracker reflects the new stage.
7. Switch to **Lawyer** — add private case notes, mark a consultation complete.
8. Watch the practice metrics update.
9. Hit **Reset demo** in the topbar to restore the seeded scenario for the
   next run-through.

Personas are: Aarav Sharma (client), Adv. Meera Iyer (lawyer), and NyaySetu
Operations (admin). The topbar switches between them, and each is its own URL,
so the browser back button walks the demo in reverse.

State survives a refresh — it lives in `localStorage` under `nyaysetu-demo-v1`.

---

## How it fits together

| Path | Role |
|---|---|
| `lib/demo-data.ts` | The seeded scenario: people, profiles, consultations, deliveries. |
| `lib/demo-reducers.ts` | Every state transition, as pure functions. All the rules live here. |
| `lib/demo-store.ts` | Module-level store, `localStorage` persistence, and the React hooks. |
| `app/dashboard/*/\*-view.tsx` | The three dashboards. They call the store exactly as they once called server actions. |

Run the rules check with:

```bash
pnpm check:demo
```

---

## Deployment

Pushing to `master` publishes to GitHub Pages via
`.github/workflows/deploy.yml`.

**One-time repo setup:** Settings → Pages → Source → **GitHub Actions**.

Live at https://ineedthatgt3.github.io/legal-logistics-platform/

The workflow sets `GITHUB_ACTIONS=true`, which is what switches on the
repository `basePath` in `next.config.ts`. A local build deliberately omits it
so `pnpm preview` serves from the root.

`public/.nojekyll` is required — without it GitHub Pages strips the `_next/`
directory and the site loads unstyled.
