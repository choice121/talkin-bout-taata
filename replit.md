<!--
PROJECT_TYPE: STATIC_WEBSITE
DEPLOYMENT_TARGET: CLOUDFLARE_PAGES
BACKEND: SUPABASE_CLOUD
DATABASE: SUPABASE_POSTGRESQL
REPLIT_ROLE: DEVELOPMENT_AND_PREVIEW
MIGRATION_REQUIRED: FALSE
BACKEND_SETUP_REQUIRED: FALSE
DATABASE_SETUP_REQUIRED: FALSE
REPLIT_PREVIEW: serve.js on port 5000 (static file server)
REPLIT_SECRETS_NEEDED: SUPABASE_URL, SUPABASE_ANON_KEY (for preview to connect to Supabase)
-->

# CHOICE PROPERTIES — REPLIT RULES

---

## ⚠️ CRITICAL — READ THIS BEFORE DOING ANYTHING ELSE

**Replit is a code editor only. It is NOT the live website. It does NOT host this project.**

The live site runs on **Cloudflare Pages**, deployed from the GitHub repository.

```
Developer edits code in Replit
        ↓
Push to GitHub (manual — does NOT happen automatically)
        ↓
Cloudflare Pages detects the commit and auto-deploys
        ↓
Live site at choiceproperties.com is updated
```

If you make changes in Replit and they do not appear on the live site, the reason is **always** one of two things:
1. The changes have not been pushed to GitHub yet
2. Cloudflare's CDN is serving a cached version of an old CSS/JS file

**Any AI working on this project must internalize this chain.** Every change made here must be production-safe for Cloudflare Pages — a static CDN. There is no server. There is no Node.js runtime in production. There is no database accessible from Cloudflare. Every file served by the live site is a plain static file.

---

## CLOUDFLARE PAGES — WHAT THIS MEANS FOR EVERY CHANGE YOU MAKE

Cloudflare Pages serves **static files only**. This means:

- ✅ HTML, CSS, vanilla JavaScript, images, fonts — all fine
- ✅ Client-side JavaScript that calls Supabase APIs — fine (Supabase is a separate cloud service)
- ✅ `generate-config.js` runs at Cloudflare build time to inject environment variables into `config.js`
- ❌ No Node.js server running in production
- ❌ No `require()` or `import` of Node modules in production code
- ❌ No server-side rendering, no API routes, no middleware
- ❌ No reading from environment variables at runtime (only at build time via `generate-config.js`)
- ❌ No filesystem access, no dynamic code execution
- ❌ No Replit-specific APIs, secrets, or services — they do not exist in production

If you write something that only works because `serve.js` is running in Replit, **it will break on the live site.**

---

## MANDATORY CSS CACHE-BUSTING RULE

Cloudflare Pages caches CSS and JS files aggressively. If you change any CSS or JS file, you **must** bump the version query string on every HTML page that references that file.

**Current versions:**
- `main.css?v=3` — bump to `?v=4` if `css/main.css` is changed
- `listings.css?v=3` — bump to `?v=4` if `css/listings.css` is changed
- `property.css?v=3` — bump to `?v=4` if `css/property.css` is changed

**How to bump:** Run this command after changing a CSS file (replace `v=3` and `v=4` with the correct old and new versions):
```bash
sed -i 's/main\.css?v=3/main.css?v=4/g' *.html landlord/*.html admin/*.html apply/*.html 2>/dev/null
```

Do this for every CSS file you change. Do it for every HTML file across the entire project — not just `index.html`. If you skip this step, visitors will see the old styles on the live site even after a successful deployment.

---

## ABSOLUTE PROHIBITIONS

- Do **NOT** connect, configure, or query the Replit / Neon PostgreSQL database
- Do **NOT** install Drizzle ORM, Prisma, or any ORM
- Do **NOT** create any backend files (`server.js`, `db.ts`, `schema.ts`, `storage.ts`, `api/*`)
- Do **NOT** install Express, Fastify, or any Node.js server framework
- Do **NOT** add any backend dependency to `package.json`
- Do **NOT** run `db:push`, `db:migrate`, or any database migration command
- Do **NOT** provision any Replit-managed infrastructure (databases, deployments, auth)
- Do **NOT** modify Supabase Edge Functions unless the user explicitly asks
- Do **NOT** modify `generate-config.js`, `SCHEMA.sql`, or `SECURITY-PATCHES.sql`
- Do **NOT** run `npm install` unless the user explicitly requests a specific package
- Do **NOT** attempt to "complete setup" or "migrate" this project — it is already complete and live
- Do **NOT** add any Replit-specific deployment configuration (`.replit` deploy settings, etc.)
- Do **NOT** tell the user to "deploy via Replit" — Replit does not deploy this project
- `serve.js` is for local Replit preview only — do not modify it to affect production behavior
- `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set as Replit secrets for local preview only; production keys are set in the Cloudflare Pages dashboard

---

## PREVIEW vs. LIVE — UNDERSTANDING THE DIFFERENCE

| Environment | URL | How it works | Who manages it |
|---|---|---|---|
| Replit preview | `*.replit.dev` (port 5000) | `node serve.js` — a simple static file server | Replit only |
| Live site | `choiceproperties.com` | Cloudflare Pages CDN serving static files | Cloudflare, deployed from GitHub |

The Replit preview is **only for development**. When a change looks correct in Replit, it still needs to be pushed to GitHub before it appears on the live site.

**How to deploy changes to the live site:**
1. Make and verify changes in Replit
2. Open the Git panel in Replit (branch icon in the left sidebar)
3. Push the commits to GitHub (`origin` → `https://github.com/choice121/talkin-bout-taata`)
4. Cloudflare Pages will automatically detect the push and deploy within 1–2 minutes

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

## DESIGN SYSTEM RULES

- **Always use CSS tokens** from `css/main.css` for colors, spacing, shadows, and typography. Tokens are defined in `:root` and follow the `--color-*`, `--space-*`, `--radius-*`, `--shadow-*` naming convention.
- **Never hardcode raw hex values** (e.g. `#006AFF`, `#1A1A1A`) in component or page CSS. If a token exists for it, use it. If a token doesn't exist, add one to `css/main.css` first, then use it.
- **Never hardcode raw pixel values** for spacing. Use the spacing scale tokens (`--space-1` through `--space-24`).
- The design system is **Zillow-inspired**: the primary action color is `--color-brand` (`#006AFF`). Do not introduce a second brand color or change the palette without explicit instruction.
- Dark sections (hero, footer, "How It Works") use `--color-dark-surface` (`#07121F`) as background. Light page content uses `--color-surface-page` (`#f5f5f5`). Cards use `--color-surface-raised` (`#ffffff`). Do not invent new background colors.

---

## JAVASCRIPT RULES

- This project uses **vanilla JavaScript only** — no TypeScript, no JSX, no React, no Vue, no framework of any kind.
- **No ES module `import`/`export` syntax** in any file served to the browser. There is no bundler. Scripts are loaded with `<script src="...">` tags and run as classic scripts in the global scope.
- **Never use `process.env`** in frontend code. Environment variables only exist at Cloudflare build time. All runtime configuration must be read from the `CONFIG` object (populated by `generate-config.js` at build time via `config.js`).
- **Never add a new CDN `<script>` or `<link>` tag** without explicit user approval. Every external dependency is a performance, privacy, and security decision.
- **All Supabase data operations go through `js/cp-api.js`**. Never write direct `fetch()` calls to the Supabase REST or Edge Function API from page-level code. Extend `cp-api.js` if new API methods are needed.

---

## IMAGE RULES

- **All property images are served via ImageKit CDN.** Never reference a raw Supabase storage URL in UI code.
- Always use the `CONFIG.img(url, preset)` helper for property photos. It applies the correct ImageKit transformations (resizing, format conversion, quality) for the given context (card thumbnail, gallery, etc.).
- Do not add local image files to the repository for UI purposes. Icons use FontAwesome. Illustrations and photos must use ImageKit or an approved CDN.

---

## PAGE STRUCTURE RULES

- **Every new public-facing HTML page must follow the existing page structure**: same `<nav>` block (copied from `index.html`), same `<footer>` block, same CSS `<link>` tags with correct version strings.
- **Do not create a new layout from scratch** for a new page. Start from the closest existing page as a template.
- The `admin/`, `landlord/`, and `apply/` folders are **separate portals** with their own CSS files (`admin.css`, `landlord.css`, `apply.css`). Changes to global CSS in `main.css` must not break these portals. Test visually across portals before marking a CSS change complete.
- New page filenames must use **kebab-case** (e.g. `move-in-guide.html`) and be placed at the repository root unless they belong to an existing sub-portal.

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
- **Nav**: White with Zillow blue house logo emblem; `nav-link--cta` (blue pill) for primary actions, `nav-link--landlord` (outlined) for landlord-facing actions
- **Nav structure** (all public pages): Browse Listings | How to Apply | FAQ | Track Application | [For Landlords] (outlined)
- **Search button**: Zillow blue (not dark ink)
- **Filter pills active state**: Zillow blue
- **Property card apply button**: Zillow blue pill shape
- **Trust strip**: 5 items across the top below hero — Verified Listings, 15-Min Application, Bank-Level Security, Real-Time Updates, All 50 States
- **How It Works**: 3-step section (Find → Apply → Move In) on homepage before listings
- **Apply form nav**: Single minimal nav (logo + Listings + Track Application + Español toggle); no internal `<header>` block; 6-step `.progress-container` is sticky at `top: 56px`
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
