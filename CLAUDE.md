@AGENTS.md

# CLAUDE.md - Engineering Constitution

## What this repo is now
A **static, browser-only investor demo**. There is no backend: no Supabase, no
database, no auth, no server actions, no API routes. It builds to plain files
with `output: "export"` and deploys to GitHub Pages.

Do not reintroduce a backend, a data-fetching layer, or a sign-in flow. If a
screen needs data, it comes from `lib/demo-data.ts` through `lib/demo-store.ts`.

## Intent & Trade-offs
* **Readability over cleverness:** The data flow must be obvious at a glance.
* **Type Safety:** Strict TypeScript. No `any`. Table shapes live in `lib/types.ts` — reuse them rather than inventing parallel demo types.
* **Rules live in one place:** every state transition belongs in `lib/demo-reducers.ts` as a pure function returning `ActionResult`. Components never mutate state directly.
* **Honesty in the UI:** seeded figures are labelled `Illustrative`, the event feed is labelled `Simulated`, and nothing may imply real legal advice, real couriers, or real customer data.

## Terminal & Execution Rules
* Always operate using `pnpm`. Never run standard `npm install`.
* Before modifying core routing or the demo store, output a step-by-step plan for approval.
* Do not read the entire repository if you do not have to.

## Static-export constraints
These break the build or the deployed site, so check them before shipping:
* No `cookies()`, `headers()`, `"use server"`, route handlers, or middleware/proxy.
* Nothing may read `localStorage` during render — gate on `useDemoReady()` or `useMounted()`.
* No `setState` inside an effect body; eslint enforces it. Put browser state in the store and read it with `useSyncExternalStore`.
* `public/.nojekyll` must exist or GitHub Pages strips `_next/`.

## Verification
Never claim a change works without running it:
```bash
pnpm check:demo   # the state rules
pnpm lint
pnpm build        # must end with a successful export
pnpm preview      # serves out/ exactly as deployed
```
