# Changelog — Choice Properties

All notable changes to this project are documented here.
Every task, fix, or update must add an entry. Most recent changes appear first.

Format:
**[YYYY-MM-DD] — Short title**
- What changed and why

---

## [2025-03-12] — Documentation enforcement system added

- Created `CHANGELOG.md` to track all project changes going forward
- Updated `replit.md` with mandatory documentation update rule — AI must update docs as part of every task
- Defined clear ownership rules for each documentation file

## [2025-03-12] — Replit AI hard rules added to replit.md

- Added ABSOLUTE PROHIBITIONS section at the top of `replit.md`
- Blocks AI from installing databases, ORMs, server frameworks, or backend files
- Blocks any migration or provisioning attempts on import to a new Replit account
- Clarifies Replit is used as a code editor only — deployment target remains Cloudflare Pages

## [2025-03-12] — Replit-specific files removed (cleanup)

- Removed `server.js` (Express static server — not needed for Cloudflare Pages)
- Removed `server/db.ts` (Drizzle/Postgres file — wrong for this project)
- Removed `node_modules/` and `package-lock.json`
- Reverted `package.json` to original state — no dependencies, build script only
- Restored workflow to `python3 -m http.server 5000`

## [2025-03-12] — Initial Replit import from GitHub

- Project imported from GitHub into Replit for editing
- No code changes made to the core application
- Node.js 20 installed for running `generate-config.js` build script
