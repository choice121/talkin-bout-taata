# Choice Properties — Rental Marketplace

## Project Overview

A comprehensive nationwide rental marketplace connecting quality tenants with verified landlords. Provides end-to-end property listing, application, lease, and communication functionality.

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **Maps**: Leaflet.js
- **Icons**: FontAwesome 6
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **Edge Functions**: Supabase Edge Functions (TypeScript)
- **Email**: Google Apps Script relay
- **Images**: ImageKit.io
- **Deployment**: Cloudflare Pages (with `generate-config.js` for env injection)
- **Dev Server**: Python 3 HTTP server (`server.py`) on port 5000

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
│   ├── main.css            # Design tokens + global components (NAV, BTN, MODAL, etc.)
│   ├── listings.css        # Hero, search bar, property cards, filter bar, footer
│   ├── property.css        # Gallery, detail layout, inquiry form
│   ├── apply.css           # Multi-step application form
│   ├── landlord.css        # Landlord portal styles
│   └── admin.css           # Admin dark theme
├── js/
│   └── cp-api.js           # Supabase API abstraction
├── landlord/               # Landlord portal pages
├── admin/                  # Admin portal pages
├── apply/                  # Tenant application dashboard
├── config.js               # Supabase + ImageKit config (injected at build)
├── config.example.js       # Template for config.js
├── generate-config.js      # Build-time env → config.js generator
├── supabase/               # Edge functions + migrations
└── SCHEMA.sql              # Database schema
```

## Running Locally

The workflow runs `python3 -m http.server 5000` which serves the repository root on port 5000 for development.

## Environment Variables

Set these in Cloudflare Pages → Settings → Environment variables:
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_ANON_KEY` — Supabase anonymous key
- `IMAGEKIT_URL` — ImageKit URL endpoint (e.g. `https://ik.imagekit.io/yourId`)
- `IMAGEKIT_PUBLIC_KEY` — ImageKit public key
- `GEOAPIFY_API_KEY` — Geoapify key for address autocomplete
- `COMPANY_NAME`, `COMPANY_EMAIL`, `COMPANY_PHONE`, `COMPANY_ADDRESS` — Branding
- `ADMIN_EMAILS` — Comma-separated list of admin email addresses

## Key Features

1. **Property Marketplace** — Browse/filter nationwide listings with map view
2. **Online Applications** — 6-step application with document uploads, co-applicants
3. **Lease Management** — Automated generation, digital signing, PDF storage
4. **Real-time Messaging** — Tenant ↔ leasing team chat
5. **Landlord Portal** — Dashboard, listings, applications, inquiries
6. **Admin Panel** — Platform oversight, email logs, landlord management
7. **Application Tracking** — Tenant-facing status dashboard with Application ID
