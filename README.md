# Atlas Talent

An applicant tracking system for **TM Systems Pvt. Ltd.** — built to the spec in
[`../frontend-architecture.md`](../frontend-architecture.md) and styled to
[`../design-system.md`](../design-system.md).

> Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4
> **This build uses static mock data — there are no API/DB/auth calls yet.**

---

## Running it

```bash
npm install      # already done
npm run dev      # http://localhost:3000  → redirects to /dashboard
npm run build    # production build
npm run typecheck
```

### Signing in

There's no database — accounts are the static mock users, authenticated by **email +
password** (one shared demo password). Sign in as any role to see that role's screens and
data; the header avatar menu has **Log out**. `⌘K` opens the command palette.

| Email | Role | Password |
| --- | --- | --- |
| `priya@tmsystems.in` | HR | `atlas1234` |
| `rakshit@tmsystems.in` | Leadership (CEO) | `atlas1234` |
| `meghna@tmsystems.in` | Interviewer | `atlas1234` |
| `sara@tmsystems.in` | Admin | `atlas1234` |

The login screen lists these — click one to fill the form, then **Sign in**. The session is a
cookie (`atlas_uid`); `src/middleware.ts` gates routes by role and bounces unauthenticated
requests to `/login`, and `lib/auth/session.ts` (`requireSession` / `requireRole`) enforces
the same server-side. e.g. an interviewer hitting `/approvals` is redirected to
`/dashboard?denied=1`; the nav only ever shows the routes a role may use.

---

## What's real vs. deferred

This is a faithful **frontend** of the architecture, wired to static data instead of a backend.

| Area | This build | The architecture's eventual target |
| --- | --- | --- |
| Data | Static modules in `src/lib/mock/*` | Postgres + Drizzle repositories |
| Reads | `features/*/queries.ts` return mock data | RSC awaiting repository calls |
| Writes | Inline optimistic UI (no persistence) | Typed server actions → service layer |
| Auth | Email + password vs. mock accounts, cookie session (`login`/`logout` server actions) | Auth.js v5 SSO, role in JWT |
| RBAC | Nav hides + `middleware.ts` and `requireRole` **refuse** by role | same, plus per-action checks |
| Forms | Plain controlled React | react-hook-form + Zod (shared schema) |
| Kanban | Click-through cards | dnd-kit drag-to-advance + `useOptimistic` |
| Live data | — | SSE + TanStack Query on dashboard widgets |

Other deliberate, pragmatic choices: **npm** (pnpm wasn't installed), **Next 16** (current
latest; the doc cited 15 — same App Router/RSC/server-action surface), and **hand-built UI
primitives** themed to the tokens rather than `shadcn` (more pixel-faithful to the design
system, no network dependency). Fonts load via Google Fonts `@import` (no build-time fetch).

---

## Structure

The route tree (`app/`) holds thin shells; the real work lives in `features/*`, each a
self-contained module (`components/`, `queries.ts`). Cross-feature UI lives in `components/`.

```
src/
├── app/
│   ├── layout.tsx            # fonts (globals.css), <body> bg
│   ├── globals.css           # Tailwind v4 @theme tokens + motion keyframes
│   ├── (auth)/login          # SSO sign-in (no chrome)
│   └── (app)/                # authenticated shell (header + nav + ⌘K)
│       ├── dashboard         # role-branched landing
│       ├── requisitions      # list · new · [id] · [id]/edit
│       ├── candidates        # directory · [id]
│       ├── pipeline          # kanban
│       ├── interviews        # list · [id]
│       ├── offers            # list · [id]
│       ├── approvals         # leadership queue
│       ├── reports           # analytics
│       ├── notifications
│       └── settings          # profile · team · templates · pipeline-config · audit-log
├── middleware.ts             # (in src/) coarse auth + role-route gate
├── features/                 # auth, requisitions, candidates, pipeline, interviews, offers,
│                             #   approvals, reports, notifications, settings, dashboard
├── components/{ui,layout,data}/
├── lib/auth/{session,credentials}.ts   # cookie session, requireRole, mock accounts
├── lib/{tokens,utils,format,permissions,motion,nav}.ts  +  lib/mock/*
├── hooks/   stores/   types/
```

## Design tokens

Defined once in `app/globals.css` (`@theme`) as Tailwind utilities — `bg-bg`, `text-ink`,
`border-line`, `bg-accent`, `bg-stage-*` — and mirrored in `lib/tokens.ts` (the `c` object)
for the inline-style cases the design system calls for (dynamic stage colour). Cream `#F2EEE3`,
ink `#1A1816`, terracotta accent `#B8462A` used sparingly. Fraunces / Geist / JetBrains Mono.
