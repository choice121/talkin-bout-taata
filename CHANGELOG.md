# Changelog — Choice Properties

All notable changes to this project are documented here.
Every task, fix, or update must add an entry. Most recent changes appear first.

Format:
**[YYYY-MM-DD] — Short title**
- What changed and why

---

## [2026-03-13] — Improvement #2: Persistent property context banner across all steps

- Added `div#propertyContextBanner` in `apply.html` between the step progress bar and the submission-progress div — outside all form sections so it persists across every step
- Reuses existing `.property-confirm-banner` CSS class (no new CSS written)
- Shows "Applying for" label, property title, address, rent/mo, and bed/bath count
- Added `_showContextBanner(prop)` and `_hideContextBanner()` methods in `apply.js`
- `onPropertySelected()` calls `_showContextBanner` on every selection (shows on pick, hides on clear/escape)
- `_activatePropertyLock()` calls `_showContextBanner` so banner appears immediately on page load when arriving from a listing
- Mobile layout handled by existing `.property-confirm-banner` media query (480px breakpoint wraps badge to full-width row)

---

## [2026-03-13] — Hardened Replit AI control — 4-layer static site enforcement

- Added `.agents/instructions.md` — dedicated agent instruction file that Replit reads on import, classifying the project as a static site and listing absolute prohibitions
- Rewrote `replit.md` — moved machine-readable `PROJECT_TYPE / DEPLOYMENT_TARGET / BACKEND` metadata to the very first lines so any AI parser reads project classification before anything else; fixed incorrect "python3" local preview reference (actual command is `node serve.js`); added explicit "NOT Replit" labels to all Cloudflare and Supabase env var sections
- Updated `package.json` description — now explicitly states static site, Cloudflare deployment, no Replit database, no ORM as the very first thing any AI sees in the manifest
- Note: `javascript_database` blueprint entry in `.replit` could not be removed (file is system-protected); mitigated by the three layers above which clearly override any database integration signals

---

## [2025-06-23] — Fix: public listings not appearing on homepage

- **Root cause**: `index.html`, `property.html`, `apply/dashboard.html`, and `apply/lease.html` all loaded `cp-api.js` as a classic `<script>`. Since `cp-api.js` contains ES6 `export` declarations, browsers throw a `SyntaxError` when parsing it as a non-module script — the entire file fails to execute, `window.CP` is never defined, and no property data loads.
- **Fix**: Changed all four pages to load `cp-api.js` as `<script type="module">` and converted their inline `<script>` blocks to `<script type="module">` as well (modules are deferred and execute in document order, so `window.CP` is guaranteed to be set before the inline module runs).
- **Additional**: Added `window.lookup`, `window.recoverById`, `window.sendRecovery` exports to `apply/dashboard.html`'s module, and `window.doSign`, `window.doCoSign` to `apply/lease.html`'s module, so `onclick` attributes in HTML templates continue to resolve these functions globally.
- **Landlord/admin pages were unaffected** — they already used `import { ... } from '../js/cp-api.js'` (ES module syntax), which is correct.

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
