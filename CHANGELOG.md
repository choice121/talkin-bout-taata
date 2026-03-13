# Changelog — Choice Properties

All notable changes to this project are documented here.
Every task, fix, or update must add an entry. Most recent changes appear first.

Format:
**[YYYY-MM-DD] — Short title**
- What changed and why

---

## [2026-03-13] — Applicant Identity Layer (Passwordless OTP Authentication)

- **New `APPLICANT-AUTH.sql` migration:** Adds `applicant_user_id uuid` column to `applications` table with a foreign key to `auth.users`, an index, and a new RLS policy (`applications_applicant_read`) so authenticated applicants can read only their own rows. Also adds two secure RPCs: `get_my_applications()` returns the calling user's full application list (safe field subset), and `claim_application(app_id, email)` lets a newly-signed-in user link a legacy application submitted before they had an account (email-verified to prevent hijacking). Grant statements included.
- **New `apply/login.html` page:** Applicant-facing passwordless OTP email sign-in. Two-step flow — enter email → receive 6-digit code → auto-submits on 6th digit. Supports `?redirect=` URL param so users land back on whatever page triggered the sign-in. Checks existing session on load and skips the form if already signed in. Includes "Track by Application ID instead" and "Resend my Application ID" fallback paths.
- **Updated `apply/dashboard.html` — auth-aware design:** On page load, checks the Supabase session. (1) If authenticated with no `?id=` param — renders a "My Applications" list showing all linked apps as clickable cards, with status/lease pills. Clicking a card opens the detail view (same `renderDetailView` function). A "Look Up a Specific Application" section is appended below the list as a fallback. (2) If not authenticated — shows the classic App ID lookup card plus a sign-in prompt banner. (3) If `?id=` param present — always shows that app directly (works for both auth and anon). Topbar now shows signed-in email + Sign Out button when authenticated. All anonymous detail views now show a "Sign in to see all your applications" prompt so users discover the feature naturally. `signOut` routes back to `/apply/login.html` for the applicant scope.
- **Updated `js/cp-api.js` — `CP.ApplicantAuth` added:** New helper object exported on `window.CP` with `sendOTP(email)`, `verifyOTP(email, token)`, `getUser()`, `getSession()`, `signOut()`, `getMyApplications()` (calls `get_my_applications()` RPC), and `claimApplication(appId, email)` (calls `claim_application()` RPC). `Auth.signOut()` updated to route to `/apply/login.html` when on an `/apply/` path (was incorrectly routing to `/landlord/login.html`).
- **Updated `supabase/functions/process-application/index.ts`:** Added optional applicant auth block after rate-limit check. Extracts the Bearer JWT from the Authorization header; if it differs from the anon key, verifies it against Supabase Auth and extracts the user UUID. Adds `applicant_user_id` to the application insert record (null for anonymous submissions). Entirely non-breaking — no change to existing anonymous flow.
- **Setup instructions:** Run `APPLICANT-AUTH.sql` once in Supabase SQL Editor. Enable Email OTP in Supabase Auth settings (Dashboard → Auth → Providers → Email → Enable OTP). No other configuration needed.

---

## [2026-03-13] — Verification & Polish Pass: Nav consistency, logo standardization, apply.html address fix

- **Nav drawer CTA fix (property.html):** `drawerAuthLink` was missing the `btn-full` class, making the "Landlord Login" button in the mobile drawer narrower than on all other pages. Added `btn-full` to match every other page.
- **Nav logo standardization — dark inline override removed (property.html, about.html, faq.html, how-to-apply.html, how-it-works.html, 404.html):** All six pages overrode the `nav-logo-mark` CSS class with an inline `background:#0f1117` or `background:var(--ink)` style, rendering a near-black logo while `index.html` showed the correct brand-blue `nav-logo-emblem`. Changed all instances to `nav-logo-emblem` (no inline styles), which carries the correct blue background, `flex-shrink:0`, and a subtle brand-shadow via CSS — consistent with the homepage.
- **Nav logo standardization — letter fallback replaced (terms.html, privacy.html):** Both pages used `<div class="nav-logo-mark">C</div>` (a plain blue square with the letter "C") rather than the SVG house icon used everywhere else. Replaced with the correct `nav-logo-emblem` + SVG markup.
- **SVG brand circle color unified:** The house SVG's inner circle was `rgba(37,99,235,0.9)` on several pages (the old Tailwind blue-600) vs the design-system brand blue `rgba(0,106,255,0.8)`. Standardized to `rgba(0,106,255,0.8)` across all affected pages.
- **apply.html footer address placeholder removed:** The hardcoded `<p>Your Business Address</p>` is now a hidden `<p id="footerAddressLine">` that reads `CONFIG.COMPANY_ADDRESS` on `DOMContentLoaded` and reveals itself only when that value is non-empty — consistent with how `footerContactLine` and `footerEmailLink` are already handled.
- **HTTP verification:** All 12 public pages confirmed returning HTTP 200 post-changes.

---

## [2026-03-13] — Bug fixes #1–6: Tenant dashboard, lease signing, and admin modal

- **Fix 1 — Lease deadline countdown (dashboard.html):** Replaced hardcoded "48 hours" with a `leaseDeadlineText()` helper that reads `lease_expiry_date` and renders the real remaining time (e.g. "within 3 days — by Fri, Mar 20"). Falls back to generic text if the field is absent.
- **Fix 2 — Lease text readability (lease.html):** Expanded `.lease-text` max-height from 400px to 600px so tenants can read significantly more of the lease agreement without scrolling inside a tiny box. Added a dynamic expiry-countdown banner at the top of the signing page (red for <24 h, amber otherwise).
- **Fix 3 — Download signed lease (dashboard.html):** Added "📄 Download Signed Lease" button to the `lease_status === 'signed'` and `co_signed` callouts. Uses `app.lease_pdf_url`, which the `get-application-status` edge function already generates as a fresh Supabase Storage signed URL on every dashboard load — so the link is never stale.
- **Fix 4 — Denial reason shown to tenants (dashboard.html):** The denial callout now conditionally renders `app.admin_notes` (written by the admin at denial time) as a "Reason provided:" sub-section. Sanitised via `escapeHTML()`.
- **Fix 5 — "Fee Paid" step accuracy (dashboard.html):** Step 2 of the progress bar was advancing to complete when `status === 'under_review'` regardless of `payment_status`. Removed the erroneous `|| app.status === 'under_review'` branch — step 2 now only shows complete when `payment_status === 'paid'`.
- **Fix 6 — Lease modal start-date pre-fill (admin/applications.html):** `openLeaseModal()` now accepts a `prefillMoveIn` parameter (the applicant's `requested_move_in_date`). The "Send Lease", "Resend Lease", and "Send New Lease" buttons pass this value; the modal sets `m-start` from it rather than defaulting to today.
- **Bonus fix — Dashboard lookup card HTML corruption (dashboard.html):** The lookup card block had literal `\n` and `\"` escape sequences in raw HTML (pre-existing). Unescaped all sequences so the card renders cleanly in all browsers.

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
