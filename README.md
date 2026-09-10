# JPopular — Frontend

Next.js 16 (App Router) admin interface for the JPopular business management system.

Architecture and business decisions live in `ARCHITECTURE-V1.md` (one level up, outside this repo).

**Current state:** login, route protection, permission-driven navigation, Admin user management, and Catalog (products, categories, brands). Inventory, invoicing, customers and payments are later stages.

## Requirements

- Node.js 20.9+ (20.20.2 in use)
- The backend API running (see `jpopular-backend`)

## Local setup

```bash
npm install
cp .env.example .env.local
npm run dev          # http://localhost:3000
```

## Environment variables

| Variable | Purpose |
|---|---|
| `API_BASE_URL` | Laravel API base including version prefix. Default `http://localhost:8000/api/v1` |

**There is deliberately no `NEXT_PUBLIC_*` API variable.** The browser never
talks to Laravel directly — it calls this app's own `/api` routes, which attach
the bearer token server-side. Anything prefixed `NEXT_PUBLIC_` is compiled into
the client bundle, so no secret may ever go there.

`.env.local` is git-ignored. This repository is public — never commit real values.

## Authentication (BFF)

```
Browser  ──▶  Next.js route handler  ──▶  Laravel
         ◀──  httpOnly cookie        ◀──  Sanctum token
```

- `POST /api/auth/login` — exchanges credentials for a Sanctum token, stores it
  in an `httpOnly` cookie, and returns **only** the user object.
- `POST /api/auth/logout` — revokes the token, clears the cookie.
- `/api/v1/*` — authenticated proxy; attaches `Authorization: Bearer` from the
  cookie. Clears the cookie on a 401.

Cookie: `httpOnly`, `sameSite=lax`, `path=/`, and `secure` driven by `NODE_ENV`
— so local HTTP works and production automatically requires HTTPS.

The token is never in `localStorage`, `sessionStorage`, or a JS-readable cookie.
`src/lib/session.ts` and `src/lib/server-api.ts` import `server-only`, so
importing them from a Client Component is a build error.

Because the browser only ever calls its own origin, **no CORS policy is needed.**

## Route protection

Two layers, only one of which is a security control:

1. `src/proxy.ts` (Next 16's renamed `middleware`) checks whether a session
   cookie is *present* and redirects. **UX only** — presence is not validity.
2. `src/app/(app)/layout.tsx` calls `/auth/me`. This is the real gate: a revoked
   or expired token lands here and redirects to `/login`.

Laravel remains the authorization authority. Every permission is re-checked by a
Policy server-side.

## Permissions in components

Never branch on a role name. Use the permission helpers:

```tsx
"use client";
import { useAuth } from "@/features/auth/AuthProvider";
import { PERMISSIONS } from "@/features/auth/permissions";

const { can } = useAuth();
if (can(PERMISSIONS.usersManage)) { /* show the button */ }
```

In Server Components, use `getCurrentUser()` with `hasPermission()`.

Hiding UI is cosmetic — a hidden route typed manually still returns 403.

## Money formatting

The API sends money, GST rates and quantities as DECIMAL **strings**
("84999.00"). `src/lib/money.ts` formats them by string manipulation and never
calls `Number()` on them, so no value passes through JavaScript floating point:

```ts
formatInr("119999.00")  // "₹1,19,999.00"  (Indian digit grouping)
formatPercent("18.00")  // "18%"
formatQuantity("25.000") // "25"
```

Display only — all business-sensitive arithmetic happens server-side with bcmath.

## Catalog notes

- **No `current_stock` input exists** on the product form. Opening stock and
  adjustments belong to Inventory so every change leaves an auditable movement;
  the API ignores the field anyway.
- **Purchase price** renders only when the user holds
  `products.view_purchase_price`. The backend also omits the field from its
  responses, so this is UX consistency rather than the control itself.
- Tables are hand-rolled rather than using TanStack Table: sorting, grouping and
  virtualisation are not needed yet. The dependency can be added when a real
  grid requirement appears.
- List pages are Server Components that fetch server-side; forms are Client
  Components using react-hook-form + zod, posting through the `/api/v1` proxy.

## Scripts

```bash
npm run dev
npm run build
npm run lint
npx tsc --noEmit
```

## Layout

```
src/
├─ app/
│  ├─ (auth)/login/           unauthenticated
│  ├─ (app)/                  authenticated shell (sidebar + topbar)
│  │  ├─ dashboard/
│  │  └─ users/               list | new | [id]/edit
│  └─ api/                    BFF: auth/login, auth/logout, v1/[...path]
├─ features/
│  ├─ auth/                   schemas, types, permissions, AuthProvider
│  └─ users/components/
├─ components/{ui,layout}/
├─ lib/                       session, server-api, api-error
└─ proxy.ts                   route protection (UX)
```

Design tokens live in `src/app/globals.css` under `@theme` — Tailwind v4 is
CSS-first, so there is no `tailwind.config` file.

## CI/CD

Two separate GitHub Actions workflows. CI never deploys; deployment never runs
outside `main`.

### Triggers

| Workflow | Runs on | Does |
|---|---|---|
| `.github/workflows/ci.yml` | PRs targeting `develop` or `main`, pushes to `develop` | `npm ci`, lint, `tsc --noEmit`, production build |
| `.github/workflows/deploy.yml` | **pushes to `main`** (plus manual `workflow_dispatch`) | re-verifies, then deploys to the VPS |

Pushes to `develop` and `feature/*`, and pull requests, are validation only —
they can never reach production.

### Branch strategy

```
feature/*  ─PR─▶  develop  ─PR─▶  main  ──▶  automatic production deploy
                  (CI only)              (CI + deploy)
```

### CI details

Node 20 (Next.js 16 requires >= 20.9), with the npm cache keyed on
`package-lock.json`. `API_BASE_URL` is set to the harmless placeholder
`http://127.0.0.1:8000/api/v1` — it is server-only (no `NEXT_PUBLIC_` prefix), so
it is never compiled into the client bundle, and the real value exists only in
the server's `.env.production`.

CI references **no secrets at all**.

`tsc --noEmit` runs separately from `next build` even though the build also
type-checks, so a type error is reported as a type error rather than as a build
failure.

### Production deployment

Runs only after the `verify` job (lint + types + build) passes, so a `main` that
cannot build is never shipped. Concurrency group
`jpopular-frontend-production` with `cancel-in-progress: false` — a deploy is
never interrupted part-way through a build or a PM2 restart.

On the VPS, inside `/var/www/jpopular/jpopular-frontend`:

1. `git fetch --prune origin main`, `git checkout main`, `git reset --hard origin/main`
2. re-assert `.env.production` still exists
3. `npm ci`
4. `npm run build`
5. `pm2 restart jpopular-frontend --update-env`
6. `pm2 save`
7. health check against `https://jpopular.in/login` from the runner (accepts 200,
   or a 3xx redirect for a visitor who still holds a session cookie)

**What deployment never does:** create, overwrite, or read `.env.production`;
put `API_BASE_URL` into source control; or run `git clean`. `git reset --hard`
rewrites tracked files only, and `.env.production` is git-ignored, so it survives
untouched — the script asserts its presence both before and after the reset.

If `npm ci` or the build fails, the workflow fails visibly and PM2 is **never
restarted**, so the previously built app keeps serving.

> Because the reset is deterministic, any manual edit to a *tracked* file on the
> server is discarded on the next deploy. That is intentional — the server always
> matches `origin/main`.

### Required GitHub secrets

| Secret | Required | Purpose |
|---|---|---|
| `VPS_HOST` | yes | server hostname or IP |
| `VPS_USER` | yes | deployment user (e.g. `deploy`) |
| `VPS_SSH_KEY` | yes | **private** key for that user, PEM, full contents |
| `VPS_PORT` | no | SSH port; defaults to `22` |
| `VPS_SSH_KNOWN_HOSTS` | recommended | `ssh-keyscan` output, to pin the host key instead of trusting on first use |

Never store `API_BASE_URL`, the production `.env.production`, or any credential
as a workflow secret — deployment does not need them.

### Production paths

| | |
|---|---|
| Frontend | `/var/www/jpopular/jpopular-frontend` |
| Site | `https://jpopular.in` |
| PM2 process | `jpopular-frontend` |

### Rollback

Deployment is a plain checkout, not a symlinked release, so rollback is a manual
git operation.

```bash
ssh deploy@<host>
cd /var/www/jpopular/jpopular-frontend

git log --oneline -10                  # find the last known-good commit
git reset --hard <good-sha>
npm ci
npm run build
pm2 restart jpopular-frontend --update-env
pm2 save

curl -I https://jpopular.in/login
```

If the frontend rollback is because of a backend API change, roll the backend
back too — the two are versioned together on `main`.
