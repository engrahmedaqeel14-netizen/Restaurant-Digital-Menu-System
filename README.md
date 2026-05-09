# Menucast Control — Restaurant Digital Menu SaaS

A cloud-based restaurant digital menu management system. Admins manage restaurants and upload menu images via a web dashboard; each restaurant displays its live menu on a TV or tablet via a mobile app that updates in real-time.

---

## Features

- **Admin Panel** — Web dashboard to manage restaurants, upload menu images, and monitor live displays
- **Display App** — Full-screen menu display for TV/tablet, auto-updates when a new menu is pushed
- **Real-time Updates** — WebSocket connection instantly pushes menu changes to all active displays
- **Cloud Storage** — Menu images stored in Google Cloud Storage, persistent across deployments
- **Session Auth** — Secure admin login with session tokens stored in PostgreSQL

---

## Architecture

```
┌─────────────────┐     REST + WebSocket      ┌─────────────────┐
│   Admin Panel   │ ◄────────────────────────► │   API Server    │
│  (React + Vite) │                            │  (Express + WS) │
└─────────────────┘                            └────────┬────────┘
                                                        │
┌─────────────────┐     REST + WebSocket               │
│  Display App    │ ◄──────────────────────────────────┘
│ (Expo / React   │
│   Native)       │
└─────────────────┘
```

| Service       | Tech                              | Path           |
|---------------|-----------------------------------|----------------|
| API Server    | Express 5, Drizzle ORM, WebSocket | `/api`         |
| Admin Panel   | React, Vite, shadcn/ui            | `/`            |
| Display App   | Expo (React Native), Expo Router  | `/menu-display`|

---

## Tech Stack

- **Runtime:** Node.js 24, TypeScript 5.9
- **Monorepo:** pnpm workspaces
- **API:** Express 5 + `ws` WebSocket server
- **Database:** PostgreSQL + Drizzle ORM
- **Validation:** Zod (v4), drizzle-zod
- **Auth:** bcryptjs, session tokens in DB
- **API Contracts:** OpenAPI spec → Orval codegen (React Query hooks + Zod schemas)
- **Build:** esbuild (CJS bundle for API), Vite (admin panel)
- **Storage:** Replit GCS-backed object storage

---

## Getting Started

### Prerequisites

- Node.js 24+
- pnpm 10+
- PostgreSQL database

### Environment Variables

| Variable                      | Description                          |
|-------------------------------|--------------------------------------|
| `DATABASE_URL`                | PostgreSQL connection string         |
| `SESSION_SECRET`              | Secret key for session signing       |
| `DEFAULT_OBJECT_STORAGE_BUCKET_ID` | GCS bucket ID for image storage |

### Install & Run

```bash
# Install all dependencies
pnpm install

# Push database schema
pnpm --filter @workspace/db run push

# Start all services
pnpm --filter @workspace/api-server run dev     # API on port 8080
pnpm --filter @workspace/admin-panel run dev    # Admin panel
pnpm --filter @workspace/menu-display run dev   # Expo display app
```

### Useful Commands

```bash
# Typecheck everything
pnpm run typecheck

# Regenerate API hooks from OpenAPI spec
pnpm --filter @workspace/api-spec run codegen

# Build all packages
pnpm run build
```

---

## Upload Flow

Menu images use a two-step presigned URL upload:

1. `POST /api/storage/uploads/request-url` → get a presigned GCS PUT URL + `objectPath`
2. `PUT <presigned URL>` → upload image directly to GCS
3. `POST /api/menus/upload` with `{ restaurantId, objectPath, notes }` → register menu in DB

Images are served at `/api/storage/objects/...`

---

## Project Structure

```
├── artifacts/
│   ├── api-server/        # Express API + WebSocket server
│   ├── admin-panel/       # React + Vite admin dashboard
│   └── menu-display/      # Expo display app
├── lib/
│   ├── db/                # Drizzle schema + migrations
│   ├── api-spec/          # OpenAPI spec + Orval codegen config
│   ├── api-client-react/  # Generated React Query hooks
│   └── api-zod/           # Generated Zod schemas
└── scripts/               # Post-merge setup script
```

---

## Default Admin Login

| Field    | Value      |
|----------|------------|
| Username | `admin`    |
| Password | `admin123` |

---

## How It Works

1. Admin logs into the web panel and adds a restaurant (assigned a Customer ID like `REST001`)
2. Admin uploads a menu image for that restaurant — stored in GCS
3. Display screen (TV/tablet) opens the display app and enters the Customer ID
4. The display shows the active menu in full-screen
5. When admin uploads a new menu, all connected displays update **instantly** via WebSocket
6. A 10-second polling fallback ensures reliability even if WebSocket drops
