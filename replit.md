# Choice Properties — Replit Context

## Role of Replit

Replit is used as a **code editor and development preview only**.

| Component | Platform |
|---|---|
| Frontend hosting | **Cloudflare Pages** (not Replit) |
| Database | **Supabase PostgreSQL** (not Replit) |
| API / backend logic | **Supabase Edge Functions** (not Replit) |
| Email relay | **Google Apps Script** (not Replit) |
| Image CDN | **ImageKit.io** (not Replit) |
| Replit's role | Code editor + live preview via `serve.js` |

There is no migration to perform, no local database to connect, and no backend to build inside Replit.

---

## Live Preview in Replit

`serve.js` is a lightweight static file server (port 5000) that:
- Regenerates `config.js` from Replit secrets on every startup
- Serves all static HTML/CSS/JS files with correct headers and gzip

The workflow runs `node serve.js` automatically. No manual steps needed.

If `SUPABASE_URL` and `SUPABASE_ANON_KEY` are set in Replit Secrets, the preview is fully connected to your live Supabase project.

---

## Project Structure

```
/                    Static HTML pages (homepage, listings, apply, etc.)
/admin/              Admin portal pages
/landlord/           Landlord portal pages
/apply/              Applicant dashboard, lease signing
/css/                All stylesheets
/js/                 cp-api.js (Supabase/API client), apply.js, imagekit.js
/assets/             Favicon, og image, placeholders
/supabase/functions/ Edge Function source (Deno TypeScript — deployed to Supabase cloud)
serve.js             Replit dev server
generate-config.js   Cloudflare Pages build script (generates config.js from env vars)
config.example.js    Config template — copy to config.js for local dev
SETUP.sql            Complete database setup — run once in Supabase SQL Editor
SETUP.md             Step-by-step deployment guide
GAS-EMAIL-RELAY.gs   Google Apps Script email relay source
```

---

## Key Rules for AI Agents

Read `.agents/instructions.md` before taking any action. Short version:

- ✅ Edit HTML, CSS, vanilla JS, or Edge Function TypeScript source files
- ❌ Do not connect, create, or migrate any Replit/Neon/local database
- ❌ Do not install ORM packages (Drizzle, Prisma, Sequelize, etc.)
- ❌ Do not create server-side route files or API handlers
- ❌ Do not modify `serve.js`, `.replit`, `generate-config.js`, or `SETUP.sql` unless explicitly asked

---

## Full Documentation

| File | Contents |
|---|---|
| `README.md` | Project overview |
| `ARCHITECTURE.md` | Full system architecture, all components, data flow, security model |
| `SETUP.md` | Step-by-step deployment guide (Supabase, GAS, Cloudflare Pages) |
| `SETUP.sql` | Complete database schema + all patches — single file, run once |
| `CHANGELOG.md` | Full history of all changes |
| `.agents/instructions.md` | Rules for AI agents working in this repo |
