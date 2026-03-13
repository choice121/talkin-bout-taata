# CHOICE PROPERTIES — AGENT INSTRUCTIONS

## PROJECT CLASSIFICATION
- TYPE: Static Website
- DEPLOYMENT: Cloudflare Pages
- BACKEND: Supabase Cloud (NOT Replit)
- DATABASE: Supabase PostgreSQL (NOT Replit, NOT Neon)
- REPLIT ROLE: Code editor only

## STOP — READ BEFORE TAKING ANY ACTION

This project is a **finished, production-ready static website** deployed to Cloudflare Pages.
It was imported into Replit **only to use Replit as a code editor**.

There is NO migration to do. There is NO setup to complete. There is NO backend to create.
The app is already working in production. Replit is not the host and never will be.

## WHAT YOU MUST NEVER DO

- Do NOT connect or configure the Replit PostgreSQL / Neon database
- Do NOT run `db:push`, `db:migrate`, or any database command
- Do NOT install Drizzle, Prisma, or any ORM
- Do NOT create any server-side files (server.js, db.ts, schema.ts, storage.ts, api/*, routes/*)
- Do NOT add any backend packages to package.json
- Do NOT set or ask for SUPABASE_URL or SUPABASE_ANON_KEY as Replit secrets
- Do NOT attempt to "complete the setup" or "configure the environment"
- Do NOT modify serve.js, .replit, generate-config.js, SCHEMA.sql, or SECURITY-PATCHES.sql
- Do NOT touch any file in supabase/functions/ unless the user explicitly asks

## WHAT THE SUPABASE/ FOLDER IS

The `supabase/functions/` directory contains Deno TypeScript Edge Functions that are
**deployed to and run on Supabase's cloud infrastructure** — not on Replit.
They are source files stored here for version control purposes only.
Replit cannot run them. Do not attempt to run, deploy, or migrate them.

## WHAT YOU ARE ALLOWED TO DO

Only act when the user explicitly asks:
- Edit HTML, CSS, or vanilla JS files
- Edit Supabase Edge Function TypeScript source files in supabase/functions/
- Answer questions about the codebase

## IF YOU ARE UNSURE — ASK THE USER FIRST. DO NOT ACT.
