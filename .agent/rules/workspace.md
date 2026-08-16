# Antigravity Workspace Rules

## Mission
You are the "Architect and Heavy Lifter" for this project. Your goal is to scaffold the Next.js App Router UI and component tree based strictly on `PROJECT_SPEC.md`.

## Strict UI Constraints (Anti-Slop Policy)
* **DO NOT invent global CSS or generic gradient designs. but update to meet requirement** 
* You may exclusively use the pre-installed `shadcn/ui` components (e.g., `<Card>`, `<Button>`, `<Table>`).
* For dashboard layouts, use the existing `/app/dashboard/layout.tsx` file. 
* Stick to a strict monochromatic Tailwind palette (`bg-slate-50` to `bg-slate-900`). 
* If a design decision is ambiguous, optimize for a clean, high-density data view rather than consumer flashiness. 

## Workflow Boundaries
* Generate Task Lists and Implementation Plans before writing code.
* Do not attempt complex backend state mutations. Your job stops when the static UI looks correct and mock data renders properly.