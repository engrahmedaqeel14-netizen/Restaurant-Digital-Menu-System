# Menucast Control — Restaurant Digital Menu SaaS

A cloud-based restaurant digital menu management system. Admins manage restaurants and upload menu images via a web dashboard; each restaurant displays its live menu on a TV/tablet via a mobile app that updates in real-time.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/admin-panel run dev` — run the admin web panel
- `pnpm --filter @workspace/menu-display run dev` — run the Expo mobile/display app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — session signing key

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + WebSocket (`ws`)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Auth: bcryptjs password hashing, session tokens in `sessions` table
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Admin Panel: React + Vite + shadcn/ui + TanStack Query
- Display App: Expo (React Native) + Expo Router

## Where things live

- `lib/db/src/schema/` — DB schema (admins, restaurants, menus, sessions)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for API contracts)
- `lib/api-client-react/src/generated/` — generated hooks (do not edit manually)
- `artifacts/api-server/src/routes/` — Express routes (auth, restaurants, menus, display)
- `artifacts/api-server/src/lib/realtime.ts` — WebSocket server + broadcastMenuUpdate
- `artifacts/api-server/uploads/` — uploaded menu images (served at `/api/menus/images/:filename`)
- `artifacts/admin-panel/src/pages/` — admin panel pages (login, dashboard, restaurants, menus, display)
- `artifacts/menu-display/app/` — Expo screens (index, display/[customerId])

## Architecture decisions

- Session tokens stored in `sessions` DB table with expiry; sent as `session` cookie + also readable from `Authorization: Bearer` header (for future mobile use)
- WebSocket server upgrades `/ws?customerId=REST001` connections; menu upload broadcasts to all clients watching that customerId
- Menus table tracks version history; only one `isActive=true` per restaurant at a time; restaurants table caches `activeMenuId` + `activeMenuUrl` for fast display reads
- Expo display app polls `/api/display/:customerId` every 10s as a fallback in addition to WebSocket for reliability
- Admin panel uses wouter for routing with a base URL from `import.meta.env.BASE_URL`

## Product

- **Admin Panel** (at `/`): Login → Dashboard with stats → Manage restaurants (add, suspend, delete) → Upload menu images per restaurant (drag-and-drop) → Menu library
- **Display App** (at `/menu-display/`): Enter Customer ID (e.g. REST001) → Full-screen menu image with live indicator → Auto-updates via WebSocket when admin pushes a new menu

## User preferences

- Admin login: username=`admin`, password=`admin123`

## Gotchas

- Upload endpoint is `POST /api/menus/upload` (not `POST /api/menus`)
- Cookie `SameSite=Lax` — works within same origin; CORS configured with `credentials: true`
- After any schema change, run `pnpm --filter @workspace/db run push` before restarting the API
- Always regenerate API client after editing `openapi.yaml`: `pnpm --filter @workspace/api-spec run codegen`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
