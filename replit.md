# Choice Properties

A nationwide rental marketplace and property management platform built as a static site with a Node.js file server.

## Architecture

**Frontend:** Pure HTML/CSS/JS static site — no build step required.

**Backend:** All API logic runs as [Supabase Edge Functions](https://supabase.com/docs/guides/functions) hosted externally on Supabase. There is no local backend or database — do NOT add one.

**File server:** `serve.js` — a lightweight Node.js HTTP server that:
- Regenerates `config.js` from environment secrets on startup
- Serves all static files with correct MIME types, caching headers, and gzip compression
- Injects `mobile.css` into HTML pages automatically

## Key Files

| File | Purpose |
|---|---|
| `serve.js` | Entry point — static file server + config generation |
| `config.js` | Auto-generated at startup from env secrets (do not edit manually) |
| `generate-config.js` | Build-time config generator (for CI/CD deployments) |
| `js/cp-api.js` | Shared browser API client — wraps Supabase calls and Edge Function calls |
| `js/apply.js` | Rental application form logic |
| `js/imagekit.js` | ImageKit CDN upload helper |
| `supabase/functions/` | Supabase Edge Functions (deployed to Supabase cloud, not run here) |

## Pages

- `/` — Homepage with property search
- `/listings.html` — Property listings
- `/apply.html` — Rental application form
- `/apply/dashboard.html` — Applicant status dashboard
- `/apply/lease.html` — Electronic lease signing
- `/admin/` — Admin portal (dashboard, applications, leases, messages, landlords, listings)
- `/landlord/` — Landlord portal (dashboard, listings, applications, inquiries)

## Environment Secrets Required

Set these in the Replit Secrets panel:

| Secret | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxxx.supabase.co`) |
| `SUPABASE_ANON_KEY` | Your Supabase project anon/public key |
| `IMAGEKIT_URL` | ImageKit CDN URL endpoint (optional — for image delivery) |
| `IMAGEKIT_PUBLIC_KEY` | ImageKit public key (optional — for uploads) |
| `GEOAPIFY_API_KEY` | Geoapify key for address autocomplete (optional) |

### Optional company config (env vars, not secrets)
`COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_TAGLINE`, `COMPANY_ADDRESS`, `ADMIN_EMAILS`

## Running

```
node serve.js
```

Starts on port 5000 (or `$PORT`). The workflow runs this automatically.

## Supabase Edge Functions

All backend logic (application processing, lease generation, email notifications, status updates) lives in `supabase/functions/`. These are deployed to your Supabase project — they are **not** run locally by this server.

To deploy edge functions:
```
supabase functions deploy --project-ref <your-project-ref>
```

Required secrets in Supabase dashboard (Edge Functions → Secrets):
- `SUPABASE_SERVICE_ROLE_KEY`
- `GAS_EMAIL_URL` + `GAS_RELAY_SECRET` (Google Apps Script email relay)
- `DASHBOARD_URL` (public URL of this app)
- `IMAGEKIT_PRIVATE_KEY` + `IMAGEKIT_URL_ENDPOINT` (for imagekit-upload function)
- `ADMIN_EMAIL` / `ADMIN_EMAILS`
