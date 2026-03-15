# Choice Properties — Replit Configuration

## Overview
Choice Properties is a nationwide rental marketplace static site. It's served by a Node.js static file server (`serve.js`) and connects to a hosted Supabase project for database, authentication, and backend logic (Edge Functions).

## Architecture
- **Frontend**: Pure HTML/CSS/JS static files, no build step required
- **Server**: `serve.js` — Node.js HTTP server that:
  1. Reads environment secrets and generates `config.js` at startup
  2. Serves all static files with correct MIME types, gzip compression, and cache headers
- **Backend**: Supabase (hosted externally)
  - Database: Supabase Postgres
  - Auth: Supabase Auth (OTP/magic link)
  - API: Supabase Edge Functions (in `supabase/functions/`)
  - Storage: Supabase Storage (lease PDFs)

## Running the Project
The workflow "Start application" runs `node serve.js` on port 5000.

On startup, `serve.js` auto-generates `config.js` from environment secrets, making Supabase credentials available to the browser.

## Required Secrets
Set these in Replit Secrets:
- `SUPABASE_URL` — Your Supabase project URL (https://xxxx.supabase.co)
- `SUPABASE_ANON_KEY` — Your Supabase anon/public key

## Optional Secrets
- `IMAGEKIT_URL` / `IMAGEKIT_PUBLIC_KEY` — For image CDN/optimization
- `GEOAPIFY_API_KEY` — For address autocomplete
- `COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_TAGLINE`, `COMPANY_ADDRESS`
- `ADMIN_EMAILS` — Comma-separated admin email addresses
- `LEASE_DEFAULT_LATE_FEE_FLAT`, `LEASE_DEFAULT_LATE_FEE_DAILY`, `LEASE_DEFAULT_EXPIRY_DAYS`
- `FEATURE_CO_APPLICANT`, `FEATURE_VEHICLE_INFO`, `FEATURE_DOCUMENT_UPLOAD`, `FEATURE_MESSAGING`, `FEATURE_REALTIME_UPDATES` — Set to `false` to disable features

## Key Files
- `serve.js` — Static file server + config.js generator
- `config.js` — Auto-generated browser config (do not edit manually)
- `config.example.js` — Reference template for config values
- `js/cp-api.js` — Main Supabase API client used across all pages
- `js/apply.js` — Application form logic
- `supabase/functions/` — Edge Functions deployed to Supabase cloud

## Pages
- `/` — Public listings homepage
- `/property.html` — Individual property listing
- `/apply.html` — Rental application form
- `/apply/dashboard.html` — Tenant application status dashboard
- `/apply/lease.html` — Lease signing page
- `/admin/` — Admin dashboard (requires admin login)
- `/landlord/` — Landlord portal (requires landlord login)
