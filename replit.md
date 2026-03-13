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
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` ARE set as Replit secrets — needed for local preview via serve.js
- Do **NOT** provision any Replit-managed infrastructure
- Do **NOT** modify Supabase Edge Functions unless the user explicitly asks
- Do **NOT** modify `generate-config.js`, `SCHEMA.sql`, or `SECURITY-PATCHES.sql`
- `serve.js` may be modified for Replit preview server improvements only (performance, headers)
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

## Design System (Zillow-Inspired — v17)

The entire site uses a **Zillow-inspired design system** with a centralized token architecture in `css/main.css`.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-brand` | `#006AFF` | Zillow Blue — all primary actions |
| `--color-brand-hover` | `#0050CC` | Button hover states |
| `--color-brand-light` | `#4D9FFF` | Accents on dark backgrounds |
| `--color-brand-pale` | `#EBF4FF` | Blue tint backgrounds |
| `--color-ink` | `#1A1A1A` | Near-black text & dark sections |
| `--color-surface-page` | `#f5f5f5` | Page background (light gray) |
| `--color-surface-raised` | `#ffffff` | Cards, modals |
| `--color-border` | `#E0E0E0` | Default borders |

### Key Design Decisions

- **Hero**: Zillow blue gradient (`135deg, #0059D6 → #006AFF → #1A80FF → #0050CC`)
- **Nav**: White with Zillow blue house logo emblem, pill-shaped blue CTA
- **Search button**: Zillow blue (not dark ink)
- **Filter pills active state**: Zillow blue
- **Property card apply button**: Zillow blue pill shape
- **Apply form header**: Zillow blue gradient
- **Footer/Why section**: Dark ink for contrast (Zillow pattern)
- **Admin portal**: Dark theme retained with Zillow blue accents

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
