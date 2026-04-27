# HuntLedger — Technical Notes

## Architecture Overview

HuntLedger runs as a single Express-served monorepo on Render. The build
process is driven by `bootstrap.mjs`, which:

1. Downloads `HuntLedger-src.zip` from GitHub (pontusburman-papabravo/HuntLedger)
2. Extracts to `HuntLedger-src/`
3. Writes F2 source files directly (AuthContext.tsx, DataAdapter.ts, App.tsx,
   AppLayout.tsx with all patches baked in — no `patchFile()` calls for these)
4. Builds the TypeScript monorepo (`npm run build`)
5. Writes `_serve.mjs` — a Fastify server that serves the React SPA
6. Writes `_start.sh` — Render start script (`cd HuntLedger-src && node _serve.mjs`)

All `patchFile()` calls have been consolidated (baked) into the corresponding
`writeFile()` calls. The `patchFile()` helper function remains defined but is no
longer called. Sessions.tsx (wild_boar_test / bear_test patches) and Dashboard.tsx
(bear_test type label / shots calc / rounds display) patches are embedded directly
into the template literals that write those files.

The **running production server** is `_serve.mjs` (Fastify + React SPA).
The root-level `server.js` + `views/` + `public/` are **legacy** — they are NOT
served in production and must NOT be used as reference.

---

## CSS Architecture

### Production App (React SPA — `HuntLedger-src/apps/web/`)

| Layer | File | How it's set |
|-------|------|-------------|
| Base styles | Vite-compiled CSS bundle | Bundled from React component CSS in `apps/web/src/` |
| Theme injection | `apps/web/dist/index.html` | **Patched post-build in `bootstrap.mjs`** via `injectBlock` (lines ~9391–9800) |

**The single source of truth for global theming is the `injectBlock` in `bootstrap.mjs`.**
All CSS variable definitions, typography rules, colour overrides, and mobile
responsive styles live in this injected `<style>` block.

### Theme: Modern Heritage Fintech (active as of 2026-04-23)

**CSS Variables** (defined in `:root` inside the injected `<style>`):

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-primary` | `#1a1a18` | Body / page background |
| `--bg-secondary` | `#2a2926` | Cards, panels, table containers |
| `--bg-sidebar` | `#151513` | Sidebar, topbar, mobile header |
| `--text-primary` | `#e8dcc8` | Main body text (warm off-white) |
| `--text-secondary` | `#a89a84` | Labels, captions, inactive nav |
| `--accent-gold` | `#c8965a` | CTAs, headings, active nav, table headers |
| `--accent-gold-hover` | `#d4a76a` | Button/link hover state |
| `--border-subtle` | `#3a3835` | All borders, dividers |
| `--success` | `#6b8f5e` | Success states |
| `--error` | `#c45a4a` | Error/danger states |

**Typography:**
- Headings h1–h3: `Aleo` (slab serif), colour `--accent-gold`
- Body, data, tables: `Inter` (sans-serif), colour `--text-primary`
- Labels/captions: `Inter`, colour `--text-secondary`
- Google Fonts loaded via `<link>` tags also in the `injectBlock`

**Mobile breakpoints:** 768px (primary) and 480px (small phones) — unchanged.

### Injection Point in `bootstrap.mjs`

The `injectBlock` template literal is located at approximately line 9391
(search for `const injectBlock = \`` to find it). It is inserted before
`</head>` in the built `apps/web/dist/index.html`.

Structure of the injected block:
1. `<!-- PWA -->` — manifest, theme-color, apple meta tags, icons
2. `<!-- Fonts -->` — Google Fonts preconnect + stylesheet link (Aleo + Inter)
3. `<style>` — **all global theme CSS**, CSS variables, typography, layout overrides
4. `<script>` — mobile sidebar toggle JS (hamburger button + overlay)

### Legacy CSS (NOT in production)

The root-level `public/css/main.css` (1021 lines) belongs to the legacy
Express/EJS server. It uses a light green forest theme (DM Sans + Space Grotesk).
This file is NOT served in production.

---

## Database

- Neon PostgreSQL, connection via `DATABASE_URL`
- Models in `apps/api/src/` — Postgres pool (`pg.Pool`)
- Migrations: `node-pg-migrate` via `migrate.js`

## Deployment

- Build command: `node bootstrap.mjs`
- Start: `sh _start.sh` → `cd HuntLedger-src && node _serve.mjs`
- DO NOT commit/push without explicit owner approval

## Key Files

| File | Purpose |
|------|---------|
| `bootstrap.mjs` | Build script — downloads source, patches, builds, injects CSS/JS |
| `_serve.mjs` | Generated Fastify server (in HuntLedger-src/) |
| `_start.sh` | Generated Render start script |
| `server.js` | **Legacy** Express server — not in production |
| `views/` | **Legacy** EJS templates — not in production |
| `public/css/main.css` | **Legacy** CSS — not in production |
| `migrate.js` | Database migration runner |
| `render.yaml` | Render service configuration |

---

## Repository Survey (2026-04-26)

### Repo Comparison

| Aspect | `pontusburman-papabravo/HuntLedger` | `Polsia-Inc/huntlog` |
|--------|-------------------------------------|----------------------|
| Purpose | Source code — user-owned monorepo | Deployment wrapper — Polsia-owned |
| Visibility | **Public** | **Private** (404 without auth) |
| Polsia write access | **No** — requires GitHub PAT from user | **Yes** — Polsia-Inc owns |
| Primary content | Fastify API + React/Vite app (TypeScript) | `bootstrap.mjs` + legacy Express server |
| Stack declared | Fastify 5, React 18, Vite 5, TypeScript | Express 4, ejs, pg (deploy wrapper only) |
| Last pushed | 2026-04-20 | Changes via Polsia pipeline |
| ZIP artifact | `HuntLedger-src.zip` (105 KB, committed) | N/A |

**Key finding:** Polsia has **no write access** to `pontusburman-papabravo/HuntLedger`.
Pushing a clean baseline back to the user's repo requires a GitHub PAT from the
owner (Pontus Burman) with `repo` scope.

---

### Source Repo File Structure (`pontusburman-papabravo/HuntLedger`)

```
HuntLedger/
├── HuntLedger-src.zip          ← Pre-built ZIP (105 KB) — what bootstrap.mjs downloads
├── README.md
├── apps/
│   ├── api/                    ← Fastify backend
│   │   ├── src/
│   │   │   ├── routes/index.ts ← API route registration
│   │   │   ├── server.ts       ← Fastify entry point
│   │   │   └── store.ts        ← In-memory data store (F1 only)
│   │   ├── dist/               ← Compiled JS (committed)
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── web/                    ← React/Vite frontend
│       ├── src/
│       │   ├── App.tsx         ← Client-side routing
│       │   ├── auth/           ← Auth adapter pattern (AuthAdapter, AuthContext, LocalStorage)
│       │   ├── components/     ← AppLayout, LanguageToggle, ProtectedRoute
│       │   ├── data/           ← Data adapter pattern (DataAdapter, DataContext, LocalStorage)
│       │   ├── i18n/           ← Localisation (sv.json + en.json)
│       │   ├── pages/          ← Dashboard, Sessions, Weapons, WeaponDetail, Ammunition, Reports, Login, Register
│       │   ├── styles/         ← globals.css
│       │   └── utils/          ← aggregate.ts, csv.ts, format.ts
│       ├── dist/               ← Vite build output (committed)
│       ├── index.html
│       ├── package.json
│       └── vite.config.ts
├── docs/
│   └── document_pdf.pdf        ← Project documentation
├── scripts/
│   ├── bootstrap.mjs           ← Minimal bootstrap (2.5 KB) — NOT the Polsia one
│   └── gcp/                    ← GCP deployment scripts (not used by Polsia)
└── GITHub/                     ← CI/ops configuration
    ├── docker/                 ← Dockerfile.web, nginx config
    ├── polsis/                 ← Polsia deployment manifest
    └── src/                    ← GitHub webhook + Polsia manifest TypeScript
```

**Note:** No `packages/` directory exists in the source repo. The `@huntledger/shared`
workspace package referenced in both `apps/api` and `apps/web` is not separately
committed — types are resolved at build time from the workspace.

---

### Deploy Repo File Structure (`Polsia-Inc/huntlog`)

```
huntlog/
├── bootstrap.mjs               ← 488 KB / ~11,261 lines — build script + all F2 patches
├── package.json                ← Express + ejs + pg + body-parser (deploy wrapper)
├── server.js                   ← 42 KB legacy Express server (NOT served in prod)
├── migrate.js                  ← Database migration runner
├── render.yaml                 ← Render service config
├── apply-theme-patches.mjs     ← Theme patch helper
├── download-huntledger.mjs     ← ZIP download helper
├── views/                      ← Legacy EJS templates (NOT served in prod)
├── public/                     ← Legacy static assets (NOT served in prod)
└── test-fixtures/
```

---

### Tech Stack

#### Backend (`apps/api`)

| Layer | Technology | Version |
|-------|-----------|---------|
| HTTP framework | **Fastify** | ^5.2.0 |
| CORS | @fastify/cors | ^10.0.1 |
| Validation | **Zod** | ^3.23.8 |
| Language | **TypeScript** | ~5.6.3 |
| Dev runner | tsx (watch mode) | ^4.19.2 |
| Logger | pino / pino-pretty | built-in / ^11.3.0 |
| Database (F2+) | **PostgreSQL** via `pg` | ^8.10.0 |
| Data store (F1) | In-memory Map | — |

#### Frontend (`apps/web`)

| Layer | Technology | Version |
|-------|-----------|---------|
| UI framework | **React** | ^18.3.1 |
| Build tool | **Vite** | ^5.4.11 |
| Routing | react-router-dom | ^6.28.0 |
| Charts | **Recharts** | ^2.13.3 |
| i18n | react-i18next + i18next | ^15.1.3 / ^24.0.5 |
| Language detection | i18next-browser-languagedetector | ^8.0.0 |
| Validation | **Zod** | ^3.23.8 |
| Language | **TypeScript** | ~5.6.3 |
| State mgmt | React Context (no Redux) | — |

#### Infrastructure / Build

| Layer | Technology |
|-------|-----------|
| Platform | **Render** (single web service) |
| Database | **Neon PostgreSQL** (`DATABASE_URL`) |
| Build trigger | `node bootstrap.mjs` |
| Start command | `sh _start.sh` → Fastify serves React SPA |
| Node version | ≥18 |
| Domain | huntledger.se (CNAME → huntlog-e293.polsia.app) |

---

### API Routes

#### F1 Source Routes (in `apps/api/src/routes/index.ts`)

These are the baseline routes in the source repo — in-memory store, no auth.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check — returns `{ status: 'ok', uptime }` |
| GET | `/api/v1/data/:userId` | Get all user data (sessions, weapons, ammo, dogs, locations) |
| POST | `/api/v1/data/:userId/weapons` | Add a weapon (Zod-validated) |
| POST | `/api/v1/data/:userId/ammunition` | Add ammunition (Zod-validated) |
| POST | `/api/v1/data/:userId/sessions` | Add a hunt session (Zod-validated) |

#### F2 Routes (injected via `bootstrap.mjs` patches — Postgres-backed, JWT auth)

These routes are written by the Polsia bootstrap script into `_serve.mjs`:

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Register new user (email + password) |
| POST | `/api/auth/login` | Login, returns JWT |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/auth/me` | Get current user from JWT |
| POST | `/api/auth/reset-password` | Password reset |
| GET/POST | `/api/sessions` | List / create hunt sessions |
| PUT/DELETE | `/api/sessions/:id` | Update / delete session |
| GET/POST | `/api/weapons` | List / create weapons |
| PUT/DELETE | `/api/weapons/:id` | Update / delete weapon |
| GET/POST | `/api/ammunition` | List / create ammunition |
| PUT/DELETE | `/api/ammunition/:id` | Update / delete ammo |
| GET/POST | `/api/locations` | List / create locations |
| DELETE | `/api/locations/:id` | Delete location |
| GET/POST | `/api/game` | List / create game log entries (viltloggning) |
| PUT/DELETE | `/api/game/:id` | Update / delete game entry |
| GET | `/api/data/export/csv` | Export all user data as CSV |

---

### Data Model

#### Core PostgreSQL Tables

**`users`** — Auth + subscription (core, always present)
```
id                      SERIAL PRIMARY KEY
email                   VARCHAR(255) NOT NULL (unique, case-insensitive)
name                    VARCHAR(255)
password_hash           VARCHAR(255)
created_at              TIMESTAMPTZ DEFAULT NOW()
updated_at              TIMESTAMPTZ DEFAULT NOW()
stripe_subscription_id  VARCHAR(255)
subscription_status     VARCHAR(50)
subscription_plan       VARCHAR(255)
subscription_expires_at TIMESTAMPTZ
subscription_updated_at TIMESTAMPTZ
```

**`_migrations`** — Migration tracking
```
id          SERIAL PRIMARY KEY
name        VARCHAR(255) NOT NULL UNIQUE
applied_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

#### Domain Tables (F2, created via bootstrap.mjs patches)

**`sessions`** — Hunt sessions
```
id          UUID PRIMARY KEY
user_id     INTEGER REFERENCES users(id)
date        DATE
location    TEXT
notes       TEXT
weather     TEXT   (weather fields added in F2)
created_at  TIMESTAMPTZ
```

**`weapons`** — Firearm registry
```
id          UUID PRIMARY KEY
user_id     INTEGER REFERENCES users(id)
name        TEXT
caliber     TEXT
notes       TEXT
created_at  TIMESTAMPTZ
```

**`ammunition`** — Ammo inventory
```
id          UUID PRIMARY KEY
user_id     INTEGER REFERENCES users(id)
weapon_id   UUID REFERENCES weapons(id)
brand       TEXT
caliber     TEXT
quantity    INTEGER
notes       TEXT
```

**`locations`** — Hunt locations (Leaflet/OpenStreetMap integration)
```
id          UUID PRIMARY KEY
user_id     INTEGER REFERENCES users(id)
name        TEXT
lat         NUMERIC
lng         NUMERIC
notes       TEXT
```

**`game_log`** — Viltloggning (9 built-in species + custom)
```
id          UUID PRIMARY KEY
user_id     INTEGER REFERENCES users(id)
session_id  UUID REFERENCES sessions(id)
species     TEXT    (e.g. 'älg', 'rådjur', 'vildsvin', 'björn', 'custom')
count       INTEGER
notes       TEXT
logged_at   TIMESTAMPTZ
```

#### Shared Type Entities (`@huntledger/shared`)

TypeScript types used across frontend + backend (resolved at build time):

| Entity | Key Fields |
|--------|-----------|
| `User` | id, email, name, createdAt |
| `Weapon` | id, name, caliber, notes, createdAt |
| `Ammunition` | id, brand, caliber, quantity, notes |
| `Session` | id, date, location, notes, weather fields |
| `Dog` | id + breed/name fields |
| `Location` | id, name, lat, lng, notes |
| `UserData` | `{ sessions[], weapons[], ammunition[], dogs[], locations[] }` |

---

### Frontend Page Routes

| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | Login.tsx | No |
| `/register` | Register.tsx | No |
| `/` | Redirect (→ /dashboard or /login) | — |
| `/dashboard` | Dashboard.tsx | **Yes** |
| `/sessions` | Sessions.tsx (9.5 KB) | **Yes** |
| `/weapons` | Weapons.tsx | **Yes** |
| `/weapons/:id` | WeaponDetail.tsx | **Yes** |
| `/ammunition` | Ammunition.tsx | **Yes** |
| `/reports` | Reports.tsx | **Yes** |

Auth is managed via `AuthContext` + `ProtectedRoute`. The frontend
uses an adapter pattern: `LocalStorageAuthAdapter` (F1) is swapped
for a Postgres/JWT-backed adapter in F2.

---

## Technical Guideline: tech_notes is the Agent's Memory

**Every task that changes file structure, API routes, data model, or tech stack MUST
update the relevant section in `tech_notes.md` as part of the deliverable.**

`tech_notes.md` is the only place the agent has to understand the project state.
If it is not current, the agent is flying blind. A task is not complete until
`tech_notes.md` reflects the change.

This applies to:
- New API endpoints or changes to existing ones → update **API Routes**
- New tables, columns, or schema changes → update **Data Model**
- New npm packages or version changes → update **Tech Stack**
- New files or directory changes → update **File Structure**
- Any change to how the build or deploy works → update **Architecture Overview** or **Key Files**
