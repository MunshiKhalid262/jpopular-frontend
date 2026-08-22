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
