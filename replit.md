# Choice Properties — Replit Configuration

## Overview
Choice Properties is a nationwide rental marketplace static site. It's served by a Node.js static file server (`serve.js`) and connects to a hosted Supabase project for database, authentication, and backend logic (Edge Functions).

## Architecture
- **Frontend**: Pure HTML/CSS/JS static files, no build step required
- **Server**: `serve.js` — Node.js HTTP server that:
  1. Reads environment secrets and generates `config.js` at startup
  2. Serves all static files with correct MIME types, gzip compression, cache headers, and security headers
- **Backend**: Supabase (hosted externally)
  - Database: Supabase Postgres
  - Auth: Supabase Auth (OTP/magic link for applicants; email/password for landlords and admins)
  - API: Supabase Edge Functions (in `supabase/functions/`)
  - Storage: Supabase Storage (lease PDFs in `lease-pdfs` bucket)

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

## Supabase Edge Functions
All backend logic runs as Supabase Edge Functions (Deno). They are deployed to your Supabase project, not to Replit:
- `process-application` — Handles rental application form submissions
- `update-status` — Updates application status (admin/landlord only)
- `mark-paid` — Marks application fee as paid
- `generate-lease` — Generates lease records and sends signing links
- `sign-lease` — Handles tenant/co-applicant lease signing and PDF generation
- `mark-movein` — Records move-in completion
- `send-message` — Sends messages between admin/landlord and applicants
- `send-inquiry` — Handles property inquiry emails
- `get-application-status` — Rate-limited status check for tenants
- `imagekit-upload` — Secure server-side image upload to ImageKit CDN

## Pages
- `/` — Public listings homepage
- `/property.html` — Individual property listing
- `/apply.html` — Rental application form
- `/apply/dashboard.html` — Tenant application status dashboard
- `/apply/lease.html` — Lease signing page
- `/apply/login.html` — Applicant OTP login
- `/admin/` — Admin dashboard (requires admin login)
- `/landlord/` — Landlord portal (requires landlord login)

## Security
- Supabase anon key and URL are exposed to the browser (this is correct and expected for Supabase)
- All sensitive secrets (service role key, GAS relay secret, ImageKit private key) live only in Supabase Edge Function secrets — never in the browser
- SSNs are masked to last-4 digits server-side before storage
- Admin/landlord actions are gated by server-side auth checks in Edge Functions
