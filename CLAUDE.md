# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KMP-ADNG (Koperasi Multi Pihak - Aset Digital Nusantara Garuda) — a cooperative "super app": digital wallet, marketplace, PPOB bill payments, ride/logistics (K-Ride), group financing, community/LMS/e-voting for members, plus an internal staff portal (accounting, treasury, admin). See `README.md` for the full feature list.

Two packages in one repo, each with its own `package.json`/`node_modules`:

- **`/src`** — frontend, React 19 + Vite + TypeScript + Tailwind.
- **`/backend`** — Express + Drizzle ORM (PostgreSQL) API.

## Commands

Run from repo root unless noted. `npm install` at root also installs `backend/` via a `postinstall` hook — you don't need to `cd backend` for a normal install.

| Command | What it does |
| --- | --- |
| `npm run dev` | Vite dev server on `:5173`, proxies `/api` and `/uploads` to `localhost:3000` |
| `npm --prefix backend run dev` | Backend dev server (`ts-node-dev`, transpile-only — no type checking), listens on `:3000` by default |
| `npm run build` | `tsc && vite build` (frontend → `backend/public/dist`) then compiles backend TS → `backend/dist`. This is the production build; see Architecture below for why it's structured this way. |
| `npm start` | Runs the compiled backend (`node backend/dist/server.js`), which also serves the built frontend — this is the single production entrypoint |
| `npm run lint` | ESLint, frontend only (`eslint . --ext ts,tsx`) |
| `npm run check` | `tsc --noEmit` for frontend **and** backend. Both are clean (0 errors) as of the type-debt cleanup — keep it that way |
| `npm run test` | Currently delegates to `npm --prefix backend run test` (Vitest). Frontend has no tests yet. |

Backend-specific (run with `npm --prefix backend run <script>`, or `cd backend` first):

- `db:push` — push Drizzle schema to the database (no migration files generated)
- `db:generate` — generate Drizzle migration files
- `db:studio` — Drizzle Studio
- `db:seed` / `db:seed:loc` — seed data / location data

Running a single test (Vitest, backend only right now):

```bash
cd backend && npx vitest run src/utils/jwt.test.ts
```

To actually run both processes locally for full-stack dev, use two terminals: `npm --prefix backend run dev` (port 3000) and `npm run dev` (port 5173, proxies to 3000). Don't use the production `build`/`start` flow for day-to-day dev — it's slower and skips HMR.

## Architecture

### Single-domain deploy: frontend is built into the backend
`vite.config.ts` sets `build.outDir` to `backend/public/dist` (not the frontend's own `dist/`). `backend/src/app.ts` serves that folder as static files, serves `/api/v1/*` from the same Express app, and falls back to `index.html` for any other non-API route (SPA fallback). So in production there is **one Node process, one port, one domain** — no separate frontend host and no CORS dance between them. `src/services/api.ts` defaults `VITE_API_URL` to the relative path `/api/v1` for exactly this reason; only set `VITE_API_URL` if you deliberately split frontend/backend across domains again. Full deploy details: `CICD.md`. Cross-domain/external-client integration (mobile apps, a separate landing page): `CENTRALIZED_BACKEND.md`.

`backend/src/server.ts` listens on `process.env.PORT` (falls back to 3000) since PaaS platforms assign ports dynamically. In dev mode (`NODE_ENV !== 'production'`) it also mounts a Vite middleware server in-process — but the actual day-to-day dev flow described above (two separate `vite`/`ts-node-dev` processes) is what's normally used.

### Backend: routes → controllers → db, JWT auth via `AuthRequest`
`backend/src/routes/index.ts` mounts one router per domain (auth, wallet, marketplace, coop, ppob, financing, accounting, admin, …) under `/api/v1`. Routes call controllers in `backend/src/controllers/`, which use Drizzle (`backend/src/db/schema.ts`) directly — there's no separate repository layer.

Auth: `backend/src/middleware/auth.middleware.ts` defines `authenticate()` (verifies the `Bearer` JWT, attaches `req.user`) and an `AuthRequest` interface (extends Express `Request` with **required** `user`/`body`/`query`/`params`) that controllers import and type their handlers with. **PIN/financial validation must happen server-side** — never trust a client-supplied "PIN is correct" flag; `bcrypt.compare()` against the stored hash is the pattern used throughout (see `reference.md` §2 for the incident this was designed around).

### `AuthRequest` vs Express's `Request.user` — why every route handler is cast
`AuthRequest.user` is required, but Express's own `Request.user` (globally augmented in `auth.middleware.ts`) is optional — this mismatch makes `tsc` reject `(req: AuthRequest, res: Response) => ...` passed directly as a route handler (`TS2769`). The fix used throughout `backend/src/routes/*.ts` is to cast every controller/middleware reference at the registration site: `someController as RequestHandler`. Keep using that pattern for new routes — don't loosen `AuthRequest` or reintroduce a build wrapper that tolerates type errors to work around it. `npm run check` and `npm run build` are both expected to stay at 0 errors.

### Frontend: no router — a state machine, not URL-based routes
Despite `react-router-dom` being a dependency, it's unused. `src/index.tsx`'s `RootApp` holds top-level state (`user`, `isInternalMode`) and switches between `Login`/`Register` (logged out), `App` (member-facing, `src/App.tsx`), and `AppInternal` (staff portal, `src/AppInternal.tsx`). Inside `App.tsx`, page switching is driven by an `AppRoute` enum stored in component state (`currentRoute`), not by the URL — there are no deep-linkable routes. Session/token lives in `localStorage` (`token`, plus namespaced keys in `src/utils/storage.ts`'s `STORAGE_KEYS`, all prefixed `kmp_adng_`).

### Env files — three different `.env`s, three different consumers
- **Root `.env`** — read only by `vite build`/`vite dev` (frontend). Only `VITE_*` vars matter here; leave `VITE_API_URL` blank for the normal same-domain setup.
- **`backend/.env`** — read by the backend at runtime (`dotenv.config()` with cwd = `backend/`, which is how it's started via `npm --prefix backend run start`). Holds `DATABASE_URL`, `JWT_SECRET`, `PORT`, Cloudflare creds, etc. Contains real production credentials — never rename/edit values here casually, and never commit it (already gitignored).
- **`backend/src/utils/.env`** — a leftover duplicate. `dotenv.config()` is called with no path (always resolves to cwd), so this file is never actually loaded — `backend/.env` is the only one that matters at runtime.

### Stray files, ignore these
`check_db.ts`, `debug_coa.ts` at repo root are ad-hoc one-off DB debug scripts (not wired into any npm script) — they explain why root `package.json` has backend-ish deps like `pg`/`drizzle-orm`/`express`. `test_tsx.ts`, `path/to/file.tsx`, and root-level `utils/storage.ts` (a stale, *different* copy of `src/utils/storage.ts`) are dead scratch files, not part of the app — don't import from or "fix" them.

## Where to look next

- `README.md` — full feature list, tech stack, setup instructions.
- `CICD.md` — build/deploy pipeline, PaaS setup, env vars required in production.
- `CENTRALIZED_BACKEND.md` — integrating external clients (mobile app, separate landing page) with this backend.
- `reference.md` — architectural decision log (race-condition fix, PIN security model, device fingerprinting plan, the single-domain consolidation, mobile migration notes).

## Working with this user

Communication is in Indonesian, casual/informal tone. Keep responses concise and direct — this user prefers short confirmations over long explanations once a decision is made. They engage well with clarifying questions before risky/ambiguous architectural or infra changes (domain choices, deploy targets, what to commit) — ask rather than assume when a choice has real consequences (e.g. touching live credentials, choosing identifier naming, deciding what goes in a public repo). They've explicitly asked for docs (`CICD.md`, `reference.md`, etc.) to be kept in sync whenever architecture actually changes — treat markdown docs as part of the deliverable for architectural work, not an afterthought. Git commits/pushes are welcome once explicitly requested, not before.
