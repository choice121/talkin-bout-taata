# CHOICE PROPERTIES — AGENT INSTRUCTIONS

## PROJECT CLASSIFICATION

| Property | Value |
|----------|-------|
| Type | Static Website |
| Deployment | **Cloudflare Pages** |
| Backend | **Supabase Cloud** (NOT Replit) |
| Database | **Supabase PostgreSQL** (NOT Replit, NOT Neon, NOT any local DB) |
| Replit Role | Code editor + live preview only |
| Migration status | **COMPLETE — nothing to migrate, nothing to set up** |

---

## ⛔ STOP — READ BEFORE TAKING ANY ACTION

This project is a **finished, production-ready static website** deployed to Cloudflare Pages.
It was imported into Replit **only to use Replit as a code editor**.

**There is NO migration to do. There is NO setup to complete. There is NO backend to create.**
The app is already working in production. Replit is not the host and never will be.

Any AI that sees this project for the first time and feels the urge to "set it up",
"complete the migration", "connect the database", or "configure the environment" —
**stop immediately**. That work does not exist. Do not invent it.

---

## WHAT YOU MUST NEVER DO

- ❌ Connect, configure, or use the Replit PostgreSQL / Neon database
- ❌ Run `db:push`, `db:migrate`, or any database command
- ❌ Install Drizzle, Prisma, Sequelize, or any ORM
- ❌ Create any server-side files (server.js, db.ts, schema.ts, storage.ts, api/*, routes/*)
- ❌ Add any backend packages to `package.json`
- ❌ Set, request, or configure `SUPABASE_URL` / `SUPABASE_ANON_KEY` as Replit secrets unless the user explicitly asks for Replit preview connectivity
- ❌ Attempt to "complete the setup" or "configure the environment" — there is nothing to configure
- ❌ Modify `serve.js`, `.replit`, `generate-config.js`, or `SETUP.sql` unless the user explicitly asks
- ❌ Touch any file in `supabase/functions/` unless the user explicitly asks
- ❌ Propose, plan, or discuss any form of database migration

---

## WHAT THE `supabase/` FOLDER IS

The `supabase/functions/` directory contains **Deno TypeScript Edge Functions** that are
**deployed to and run on Supabase's cloud infrastructure** — not on Replit.
They are source files stored here for version control purposes only.
Replit cannot run them. Do not attempt to run, deploy, or migrate them.

---

## WHAT YOU ARE ALLOWED TO DO

Only act when the user explicitly asks:
- ✅ Edit HTML, CSS, or vanilla JS files
- ✅ Edit Supabase Edge Function TypeScript source files in `supabase/functions/`
- ✅ Answer questions about the codebase
- ✅ Add or improve frontend features

---

## IF YOU ARE UNSURE — ASK THE USER FIRST. DO NOT ACT.
