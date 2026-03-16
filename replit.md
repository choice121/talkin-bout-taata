# Choice Properties — Replit Environment

## Project Overview
Choice Properties is a nationwide rental marketplace — a **static site** served by a lightweight Node.js file server (`serve.js`). All backend logic runs as **Supabase Edge Functions** hosted on Supabase cloud. There is no local database and no ORM.

## Architecture
- **Frontend**: Static HTML/CSS/JS files served from the project root
- **Server**: `serve.js` — Node.js HTTP server (no Express), port 5000
- **Backend API**: Supabase Edge Functions (Deno, hosted on Supabase cloud)
- **Database**: Supabase Postgres (hosted on Supabase cloud)
- **Image CDN**: ImageKit
- **Email relay**: Google Apps Script (GAS) relay for transactional emails
- **Address autocomplete**: Geoapify

## How It Works
On startup, `serve.js`:
1. Reads Replit environment secrets
2. Regenerates `config.js` with those values so the browser has access to public keys
3. Starts the HTTP server on port 5000

The browser then uses the Supabase JS client (loaded from CDN in HTML files) to call Supabase Edge Functions and query the database directly with Row-Level Security.

## Workflow
- **"Start application"** runs `node serve.js` on port 5000 (mapped to external port 80)

## Environment Secrets Required
Set these in Replit's Secrets panel (Tools → Secrets). The server reads them at startup and injects public-safe values into `config.js`:

| Secret | Description |
|--------|-------------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xyz.supabase.co`) |
| `SUPABASE_ANON_KEY` | Supabase public anon key (safe for browser) |
| `IMAGEKIT_URL` | ImageKit URL endpoint (e.g. `https://ik.imagekit.io/yourID`) |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key |
| `GEOAPIFY_API_KEY` | Geoapify address autocomplete key |
| `COMPANY_NAME` | Display name (default: "Choice Properties") |
| `COMPANY_EMAIL` | Contact email |
| `COMPANY_PHONE` | Contact phone |
| `COMPANY_TAGLINE` | Tagline (default: "Your trust is our standard.") |
| `COMPANY_ADDRESS` | Business address |
| `ADMIN_EMAILS` | Comma-separated admin email list |
| `LEASE_DEFAULT_LATE_FEE_FLAT` | Default flat late fee (default: 50) |
| `LEASE_DEFAULT_LATE_FEE_DAILY` | Default daily late fee (default: 10) |
| `LEASE_DEFAULT_EXPIRY_DAYS` | Lease link expiry in days (default: 7) |
| `FEATURE_CO_APPLICANT` | Enable co-applicant (default: true) |
| `FEATURE_VEHICLE_INFO` | Enable vehicle info (default: true) |
| `FEATURE_DOCUMENT_UPLOAD` | Enable document upload (default: true) |
| `FEATURE_MESSAGING` | Enable messaging (default: true) |
| `FEATURE_REALTIME_UPDATES` | Enable realtime (default: true) |

**Supabase Edge Function secrets** (set in Supabase Dashboard → Edge Functions → Secrets, NOT in Replit):
- `GAS_EMAIL_URL` — Google Apps Script email relay URL
- `GAS_RELAY_SECRET` — Secret token for GAS relay authentication
- `IMAGEKIT_PRIVATE_KEY` — ImageKit private key (never expose to browser)
- `DASHBOARD_URL` — Public site root URL (used to build signing links in emails)
- `ADMIN_EMAIL` — Admin notification email for process-application

## Key Files
- `serve.js` — Static file server + config.js generator
- `config.js` — Auto-generated at startup from env secrets (do not edit manually)
- `config.example.js` — Template showing all config fields with placeholder values
- `generate-config.js` — CI/CD build-time config generator (for Cloudflare Pages etc.)
- `js/cp-api.js` — Shared Supabase API client used by all pages
- `js/apply.js` — Rental application form logic
- `js/imagekit.js` — ImageKit upload helper
- `supabase/functions/` — Edge Function source (deployed to Supabase cloud)

## Page Structure
- `/` — Public listings homepage
- `/property.html` — Individual property detail page
- `/apply.html` — Rental application form
- `/apply/dashboard.html` — Applicant status dashboard
- `/apply/lease.html` — Lease signing page
- `/admin/` — Admin dashboard (login, applications, listings, leases, messages)
- `/landlord/` — Landlord portal (dashboard, listings, applications, messages)

## Supabase Edge Functions
All deployed to Supabase cloud — not run locally:
- `process-application` — Receives application form submissions, saves to DB, fires emails
- `get-application-status` — Rate-limited status lookup for applicants
- `generate-lease` — Admin-triggered lease generation with state compliance
- `sign-lease` — Tenant/co-applicant signing, PDF generation, void action
- `update-status` — Admin/landlord application status updates
- `send-message` — Admin/landlord → tenant messaging
- `send-inquiry` — Property inquiry emails + app-ID recovery
- `mark-paid` — Mark application fee as paid
- `mark-movein` — Record tenant move-in
- `imagekit-upload` — Server-side ImageKit upload (keeps private key secure)

## Important Notes
- Do NOT add a Node.js/Express backend — all API logic lives in Supabase Edge Functions
- Do NOT add a local database (Neon, SQLite, etc.) — Supabase Postgres is the database
- Do NOT add Drizzle or any ORM — this is a static site
- `config.js` is regenerated every time `serve.js` starts — never edit it manually
- The `supabase/functions/` folder contains Deno code deployed to Supabase cloud, not Node.js
