<!--
PROJECT_TYPE: STATIC_WEBSITE
DEPLOYMENT_TARGET: CLOUDFLARE_PAGES
BACKEND: SUPABASE_CLOUD
DATABASE: SUPABASE_POSTGRESQL
REPLIT_ROLE: CODE_EDITOR_ONLY
MIGRATION_REQUIRED: FALSE
BACKEND_SETUP_REQUIRED: FALSE
DATABASE_SETUP_REQUIRED: FALSE
-->

# CHOICE PROPERTIES — REPLIT RULES

## THIS PROJECT IS A STATIC WEBSITE. REPLIT IS A CODE EDITOR ONLY.

Deployment target = **Cloudflare Pages**. Backend = **Supabase cloud**. Replit hosts nothing.

---

## ABSOLUTE PROHIBITIONS

- Do **NOT** connect, configure, or query the Replit / Neon PostgreSQL database
- Do **NOT** install Drizzle ORM, Prisma, or any ORM
- Do **NOT** create any backend files (`server.js`, `db.ts`, `schema.ts`, `storage.ts`, `api/*`)
- Do **NOT** install Express, Fastify, or any Node.js server framework
- Do **NOT** add any backend dependency to `package.json`
- Do **NOT** run `db:push`, `db:migrate`, or any database migration command
- Do **NOT** set `SUPABASE_URL` or `SUPABASE_ANON_KEY` as Replit secrets — not needed here
- Do **NOT** provision any Replit-managed infrastructure
- Do **NOT** modify Supabase Edge Functions unless the user explicitly asks
- Do **NOT** modify `serve.js`, `generate-config.js`, `SCHEMA.sql`, or `SECURITY-PATCHES.sql`
- Do **NOT** run `npm install` unless the user explicitly requests a specific package
- Do **NOT** attempt to "complete setup" or "migrate" this project — it is already complete

---

## WHAT THIS PROJECT IS

| Layer | Technology | Where it runs |
|---|---|---|
| Frontend | Vanilla HTML / CSS / JS | Cloudflare Pages (static CDN) |
| Backend API | Supabase Edge Functions (Deno/TypeScript) | Supabase cloud — NOT Replit |
| Database | Supabase PostgreSQL | Supabase cloud — NOT Replit |
| Auth | Supabase Auth | Supabase cloud |
| Email | Google Apps Script relay | Google cloud |
| Images | ImageKit.io CDN | ImageKit cloud |
| Address autocomplete | Geoapify API | Geoapify cloud |
| Local preview in Replit | `node serve.js` on port 5000 | Replit only (static file server) |

The `supabase/functions/` directory contains Edge Function source files stored here for
version control. They run on Supabase's cloud. Replit cannot run them. Do not attempt
to run, deploy, or migrate them.

---

## WHAT YOU ARE ALLOWED TO DO

Only when explicitly asked by the user:
- Edit HTML, CSS, or vanilla JS files
- Edit Supabase Edge Function source in `supabase/functions/`
- Answer questions about the codebase or architecture

**If you are ever unsure — ask the user first. Do not act.**

---

## MANDATORY AFTER EVERY TASK — Documentation Update Rule

After completing **any** task — no matter how small — update documentation before marking work done.

| File | Update when... |
|---|---|
| `CHANGELOG.md` | **Every task, no exceptions** — prepend one entry at the top |
| `replit.md` | Project structure, tech stack, or AI rules change |
| `README.md` | A major feature is added, removed, or renamed |
| `ARCHITECTURE.md` | A service, Edge Function, database table, or security model changes |
| `SETUP.md` | Deployment steps, required secrets, or environment variables change |
| `IMAGEKIT-SETUP.md` | ImageKit configuration or workflow changes |

CHANGELOG.md entry format (always prepend — newest entry first):
```
## [YYYY-MM-DD] — Short title of what changed

- What was changed and why
- Files affected
```

---

# Choice Properties — Rental Marketplace

## Project Overview

A comprehensive nationwide rental marketplace connecting quality tenants with verified landlords. Provides end-to-end property listing, application, lease, and communication functionality.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Maps**: Leaflet.js
- **Icons**: FontAwesome 6
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Edge Functions**: Supabase Edge Functions (TypeScript/Deno)
- **Email**: Google Apps Script relay
- **Images**: ImageKit.io
- **Deployment**: Cloudflare Pages (with `generate-config.js` for env injection)
- **Local Preview in Replit**: `node serve.js` on port 5000 (static file server only)

## Design System (Premium Emerald — v17)

The entire site uses a **Premium Emerald design system** with a centralized token architecture in `css/main.css`.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `#1B5E3B` | Deep emerald — all primary actions |
| `--color-brand-hover` | `#154D30` | Button hover states |
| `--color-brand-light` | `#2D8A5E` | Accents on dark backgrounds |
| `--color-brand-pale` | `#F0FDF6` | Emerald tint backgrounds |
| `--color-accent` | `#E8A23C` | Amber — hero italic word accent |
| `--color-dark-surface` | `#0B1F14` | Forest night — footer, dark sections |
| `--color-ink` | `#1C1917` | Warm near-black text |
| `--color-surface-page` | `#FAFAF8` | Warm off-white page background |
| `--color-surface-raised` | `#ffffff` | Cards, modals |
| `--color-border` | `#E5E0D8` | Warm-tinted borders |

### Key Design Decisions

- **Hero**: Forest night emerald gradient (`150deg, #071510 → #0D2218 → #0F2A1E → #081812`)
- **Hero headline em**: Amber italic in Fraunces serif (`var(--color-accent)` = #E8A23C)
- **Font**: Plus Jakarta Sans (UI) + Fraunces (hero/display headings)
- **Nav**: White with emerald house logo, pill-shaped emerald CTA
- **Search button**: Emerald (matches brand)
- **Filter pills active state**: Emerald brand
- **Apply form header**: Forest night emerald gradient
- **Footer/Why section**: Forest night (`#0B1F14`) for contrast
- **Admin sidebar**: Forest night (`#0B1F14`) with emerald hover/active states
- **Landlord auth side**: Forest night emerald gradient
- **Shadows**: Warm-tinted (`rgba(20, 12, 5, ...)`) for organic depth

## Project Structure

```
/ (repository root)
├── index.html              # Main listings/homepage
├── property.html           # Property detail page
├── apply.html              # Rental application form
├── how-it-works.html
├── how-to-apply.html
├── about.html / faq.html
├── css/
│   ├── main.css            # Design tokens + global components
│   ├── listings.css        # Hero, search bar, property cards
│   ├── property.css        # Gallery, detail layout, inquiry form
│   ├── apply.css           # Multi-step application form
│   ├── landlord.css        # Landlord portal styles
│   └── admin.css           # Admin dark theme
├── js/
│   └── cp-api.js           # Supabase API abstraction
├── landlord/               # Landlord portal pages
├── admin/                  # Admin portal pages
├── apply/                  # Tenant application dashboard
├── supabase/functions/     # Deno Edge Functions source (deployed to Supabase, NOT Replit)
├── config.js               # Auto-generated at Cloudflare build time (gitignored)
├── config.example.js       # Template — safe to edit
├── generate-config.js      # Cloudflare build script: env vars → config.js
├── serve.js                # Replit-only static file server for local preview
├── GAS-EMAIL-RELAY.gs      # Google Apps Script email relay source
├── SCHEMA.sql              # Supabase database schema (run once in Supabase dashboard)
└── SECURITY-PATCHES.sql    # Security patches (run once in Supabase after schema)
```

## Cloudflare Pages Build Settings

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node generate-config.js` |
| Build output directory | `.` |

## Environment Variables (Set in Cloudflare Pages Dashboard — NOT in Replit)

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `IMAGEKIT_URL` — ImageKit URL endpoint
- `IMAGEKIT_PUBLIC_KEY` — ImageKit public key
- `GEOAPIFY_API_KEY` — Geoapify address autocomplete key
- `COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_ADDRESS` — Branding
- `ADMIN_EMAILS` — Comma-separated admin email addresses

## Supabase Edge Function Secrets (Set in Supabase Dashboard — NOT in Replit)

- `GAS_EMAIL_URL` — Google Apps Script Web App URL
- `GAS_RELAY_SECRET` — Shared secret (must match GAS Script Properties)
- `IMAGEKIT_PRIVATE_KEY` — ImageKit private key
- `IMAGEKIT_URL_ENDPOINT` — ImageKit URL endpoint
- `ADMIN_EMAIL` — Admin notification email
- `DASHBOARD_URL` — Live site URL (used in lease signing links)
- `FRONTEND_ORIGIN` — Same as DASHBOARD_URL

## Key Features

1. **Property Marketplace** — Browse/filter nationwide listings with map view
2. **Online Applications** — 6-step application with document uploads, co-applicants
3. **Lease Management** — Automated generation, digital signing, PDF storage
4. **Real-time Messaging** — Tenant ↔ leasing team chat
5. **Landlord Portal** — Dashboard, listings, applications, inquiries
6. **Admin Panel** — Platform oversight, email logs, landlord management
7. **Application Tracking** — Tenant-facing status dashboard with Application ID
