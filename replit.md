# ⚠️ CRITICAL — READ THIS BEFORE DOING ANYTHING

This project is a **STATIC WEBSITE** deployed on **CLOUDFLARE PAGES**.
Replit is used **ONLY as a code editor**. Nothing more.

## ABSOLUTE PROHIBITIONS — Never do any of the following:

- Do **NOT** install a Replit database, Neon database, or any database
- Do **NOT** install Drizzle ORM, Prisma, or any ORM
- Do **NOT** create `server.js`, `db.ts`, `schema.ts`, `storage.ts`, or any backend files
- Do **NOT** install Express, Fastify, or any Node.js server framework
- Do **NOT** add backend dependencies to `package.json`
- Do **NOT** run `db:push`, `db:migrate`, or any database migration command
- Do **NOT** provision any Replit-managed infrastructure
- Do **NOT** modify the Supabase Edge Functions unless explicitly asked by the user
- Do **NOT** run `npm install` unless explicitly asked for a specific package
- Do **NOT** attempt to "migrate" this project — it is already complete and production-ready
- Do **NOT** touch `SCHEMA.sql` or `SECURITY-PATCHES.sql` — these are for Supabase only

## What This Project IS

- Pure static **HTML / CSS / JS** files — no build pipeline, no framework
- **Backend** = Supabase Edge Functions (hosted on Supabase's cloud, not here)
- **Database** = Supabase PostgreSQL (hosted on Supabase's cloud, not here)
- **Deployment target** = Cloudflare Pages (not Replit)
- **Local preview** = `python3 -m http.server 5000` (already configured, do not change)
- **Email** = Google Apps Script relay (`GAS-EMAIL-RELAY.gs`)
- **Images** = ImageKit.io CDN
- **Address autocomplete** = Geoapify API

## The ONLY Things You Should Do in Replit

- Edit HTML, CSS, or JS files **when explicitly asked**
- Edit Supabase Edge Function code in `supabase/functions/` **when explicitly asked**
- Answer questions about the codebase or setup

## If You Are Ever Unsure — ASK FIRST. Do Not Act.

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
- **Local Preview**: Python 3 HTTP server on port 5000

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
├── supabase/functions/     # 10 Deno Edge Functions (deployed to Supabase)
├── config.js               # Auto-generated at Cloudflare build time (gitignored)
├── config.example.js       # Template — safe to edit
├── generate-config.js      # Cloudflare build script: env vars → config.js
├── GAS-EMAIL-RELAY.gs      # Google Apps Script email relay source
├── SCHEMA.sql              # Full Supabase database schema (run once in Supabase)
└── SECURITY-PATCHES.sql    # Security patches (run once in Supabase after schema)
```

## Cloudflare Pages Build Settings

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `node generate-config.js` |
| Build output directory | `.` |

## Environment Variables (Set in Cloudflare Pages Dashboard)

- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous/public key
- `IMAGEKIT_URL` — ImageKit URL endpoint
- `IMAGEKIT_PUBLIC_KEY` — ImageKit public key
- `GEOAPIFY_API_KEY` — Geoapify address autocomplete key
- `COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_ADDRESS` — Branding
- `ADMIN_EMAILS` — Comma-separated admin email addresses

## Supabase Edge Function Secrets (Set in Supabase Dashboard)

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
