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
> data. Every name, address, case note and figure is synthetic, and the
> on-screen numbers are labelled `Illustrative` and `Simulated`.

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

That builds the static export into `out/` and serves it. Works with the
network unplugged — worth confirming before a pitch.

---

## Presenting

The app carries its own script. A **walkthrough panel** sits bottom-right with
eight steps: what to do on screen, and the point to make while doing it.
`Next` moves the step *and* switches to the persona that step belongs to, so
you cannot lose your place mid-sentence. Dismiss it with `×`; reopen from the
`Walkthrough` button.

Before each run-through, press **Reset demo** in the topbar. It restores the
seeded scenario and returns the walkthrough to step one.

Three things to point at, in order:

1. **Landing** — the thesis and the scale numbers, before anyone clicks.
2. **Client → Admin → Client** — the loop that closes. Book, request a
   delivery, advance it as ops, come back and see it moved. This is the demo.
3. **Lawyer** — the supply side, and the second revenue line.

Personas are Aarav Sharma (client), Adv. Meera Iyer (lawyer), and NyaySetu
Operations (admin). Each is its own URL, so the browser back button walks the
demo in reverse, and a direct link drops you into any screen cold.

State survives a refresh — it lives in `localStorage` under `nyaysetu-demo-v1`.

---

## How it fits together

| Path | Role |
|---|---|
| `lib/demo-data.ts` | The seeded scenario, plus the headline figures and the ticker vocabulary. |
| `lib/demo-reducers.ts` | Every state transition, as pure functions. All the rules live here. |
| `lib/demo-store.ts` | Module-level store, `localStorage` persistence, and the React hooks. |
| `components/demo/` | Walkthrough panel, activity ticker, traction strip, loading skeleton. |
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
