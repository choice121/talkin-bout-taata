# Choice Properties — Complete Setup & Deployment Guide

Follow these steps in order. Each step has dependencies on the ones before it.
Estimated time: 45–60 minutes on your first run.

---

## Before You Start — Accounts You Need

Create accounts (all have free tiers) before beginning:

| Service | URL | Purpose |
|---|---|---|
| Supabase | supabase.com | Database + Edge Functions |
| Google (for GAS) | script.google.com | Email relay |
| Cloudflare | cloudflare.com | Frontend hosting |
| ImageKit | imagekit.io | Image CDN |
| Geoapify | geoapify.com | Address autocomplete |

Your code must be in a **GitHub repository** — Cloudflare Pages deploys directly from GitHub.
If it isn't there yet, push it now before continuing.

---

## Step 1 — Generate Your Relay Secret

This secret authenticates communication between your Edge Functions and the GAS email relay.
Generate a random string — use a password manager, or run this in any terminal:

```
openssl rand -hex 24
```

**Save it somewhere safe. You will paste it in exactly two places — it must match in both or emails will not send.**

Call it your `RELAY_SECRET` throughout this guide.

---

## Step 2 — Supabase Project + Database

### 2a — Create the project

1. Go to **supabase.com** → sign in → **New project**
2. Choose an organisation, give your project a name, set a strong database password, pick your region
3. Wait for the project to finish provisioning (takes about 1 minute)

### 2b — Run the database setup

1. In your Supabase project, go to **SQL Editor** → **New query**
2. Open `SETUP.sql` from this repo — paste the entire contents into the editor
3. Click **Run** → wait for the success message
4. That's everything — one file, one run. No other SQL files needed.

### 2c — Save your project credentials

Go to **Supabase → Project Settings → API** and save these — you'll need them in later steps:

| Item | Where to find it | Label in Supabase |
|---|---|---|
| Project URL | Settings → API | "Project URL" |
| Anon public key | Settings → API | "anon public" (starts with `eyJ`) |
| Service role key | Settings → API | "service_role" (starts with `eyJ`) — keep this private |
| Project Reference ID | Settings → General | Short alphanumeric string under "Reference ID" |

---

## Step 3 — Supabase Auth Configuration

### 3a — Enable Email OTP

Applicants log in using a one-time code sent to their email — no password required.

Go to **Supabase → Authentication → Providers → Email**:
- Confirm Email is enabled
- Enable **"Email OTP"** (one-time password login)

### 3b — Configure redirect URLs

Go to **Supabase → Authentication → URL Configuration**:

- **Site URL**: `https://yourdomain.com`
- **Redirect URLs** — add all of these:
  - `https://yourdomain.com/landlord/login.html`
  - `https://yourdomain.com/admin/login.html`
  - `https://yourdomain.com/apply/dashboard.html`

Replace `yourdomain.com` with your actual domain throughout. If you don't have one yet, use the `*.pages.dev` domain Cloudflare will assign you in Step 6 — you can update it later.

---

## Step 4 — ImageKit (Image CDN)

Images uploaded through the platform are stored and served via ImageKit.

1. Go to **imagekit.io** → sign in → create an account if needed
2. Your **URL endpoint** is shown on the dashboard — it looks like `https://ik.imagekit.io/your-id`
3. Go to **Developer Options** and copy:
   - **Public Key** (starts with `public_`)
   - **Private Key** (starts with `private_`) — keep this private

Save all three values. You need them in Steps 5 and 6.

---

## Step 5 — Google Apps Script Email Relay

GAS sends all transactional emails on behalf of your Google account using `MailApp`.

### 5a — Create and configure the script

1. Go to **script.google.com** → **New project**
2. Delete all default code
3. Open `GAS-EMAIL-RELAY.gs` from this repo — paste the entire contents
4. Click **Project Settings** (gear icon, left sidebar)
5. Scroll to **Script Properties** → click **Add script property** and add each of these:

| Property Name | Value |
|---|---|
| `RELAY_SECRET` | Your relay secret from Step 1 — must be identical |
| `ADMIN_EMAILS` | Your admin email address (or comma-separated list for multiple) |
| `COMPANY_NAME` | Your business name |
| `COMPANY_EMAIL` | Your reply-to email address |
| `COMPANY_PHONE` | Your phone number |
| `DASHBOARD_URL` | Your live site URL e.g. `https://yourdomain.com` |

### 5b — Deploy as a Web App

1. Click **Deploy** (top right) → **New deployment**
2. Click the gear icon next to "Type" → select **Web App**
3. Set:
   - **Execute as**: Me
   - **Who has access**: Anyone
4. Click **Deploy** → authorise permissions when prompted (Google will ask if you trust yourself)
5. Copy the **Web App URL** — it looks like `https://script.google.com/macros/s/AK.../exec`

**Save this URL.** You'll paste it in the next step.

> Future code changes: always use **Deploy → Manage deployments → Edit (pencil icon) → Deploy**. Never create a new deployment — that generates a new URL and breaks email sending.

---

## Step 6 — Supabase Edge Function Secrets

Your 10 Edge Functions read configuration from secrets set here. Go to **Supabase → Settings → Edge Functions → Secrets** and add all of the following.

### Required — core functionality

| Secret Name | Value |
|---|---|
| `SUPABASE_ANON_KEY` | Your Supabase anon public key from Step 2c |
| `GAS_EMAIL_URL` | Your GAS Web App URL from Step 5b |
| `GAS_RELAY_SECRET` | Your relay secret from Step 1 — must match GAS exactly |
| `DASHBOARD_URL` | Your live site URL e.g. `https://yourdomain.com` |
| `ADMIN_EMAIL` | Your admin email address |

### Required — image uploads

| Secret Name | Value |
|---|---|
| `IMAGEKIT_PRIVATE_KEY` | Your ImageKit private key from Step 4 |
| `IMAGEKIT_URL_ENDPOINT` | Your ImageKit URL endpoint from Step 4 |

> Note: `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are **automatically injected** by Supabase into every Edge Function — you do not need to add them manually.

---

## Step 7 — Cloudflare Pages Frontend Deploy

### 7a — Create the Pages project

1. Go to **dash.cloudflare.com** → **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. Connect your GitHub account → select your repository → click **Begin setup**

### 7b — Build settings

| Setting | Value |
|---|---|
| Framework preset | None |
| Root directory | `/` (repository root) |
| Build command | `node generate-config.js` |
| Build output directory | `.` |

### 7c — Environment variables

Still in the setup flow, scroll to **Environment variables** and add all of the following.

**Required — build fails without these:**

| Variable | Value |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL from Step 2c |
| `SUPABASE_ANON_KEY` | Your Supabase anon public key from Step 2c |
| `IMAGEKIT_URL` | Your ImageKit URL endpoint e.g. `https://ik.imagekit.io/your-id` |
| `IMAGEKIT_PUBLIC_KEY` | Your ImageKit public key from Step 4 |

**Required — site won't work correctly without these:**

| Variable | Value |
|---|---|
| `COMPANY_NAME` | Your business name |
| `COMPANY_EMAIL` | Your business email |
| `COMPANY_PHONE` | Your phone number |
| `COMPANY_ADDRESS` | Your business address |
| `ADMIN_EMAILS` | Your admin email (comma-separated for multiple) |

**Recommended:**

| Variable | Value |
|---|---|
| `GEOAPIFY_API_KEY` | Your Geoapify API key (address autocomplete on application form) |
| `COMPANY_TAGLINE` | Your tagline — defaults to "Your trust is our standard." |

**Lease defaults (optional — sensible values pre-set):**

| Variable | Default | Purpose |
|---|---|---|
| `LEASE_DEFAULT_LATE_FEE_FLAT` | `50` | Flat late fee in dollars |
| `LEASE_DEFAULT_LATE_FEE_DAILY` | `10` | Daily late fee after flat fee |
| `LEASE_DEFAULT_EXPIRY_DAYS` | `7` | Days before lease offer expires |

**Feature flags (optional — all on by default, set to `false` to disable):**

| Variable | Controls |
|---|---|
| `FEATURE_CO_APPLICANT` | Co-applicant section on application form |
| `FEATURE_VEHICLE_INFO` | Vehicle information section on application form |
| `FEATURE_DOCUMENT_UPLOAD` | Document upload on application form |
| `FEATURE_MESSAGING` | In-app messaging between tenants and landlords |
| `FEATURE_REALTIME_UPDATES` | Live status updates via Supabase Realtime |

### 7d — Deploy

Click **Save and Deploy**. Cloudflare will clone your repo, run `node generate-config.js`, and deploy.

Your site will be live at a `*.pages.dev` URL within 1–2 minutes. Every push to `main` triggers an automatic redeploy from this point forward.

**Custom domain:** Cloudflare Pages → your project → **Custom domains** → Add domain. SSL is automatic and instant.

---

## Step 8 — Deploy Edge Functions

This step deploys the 10 Deno Edge Functions to your Supabase project. You only need to do this once, and again any time you change the function code.

Run the following in your terminal from the project root (requires Node.js):

```bash
# Log in to Supabase CLI
npx supabase login

# Deploy all functions — replace YOUR_PROJECT_REF with your Reference ID from Step 2c
npx supabase functions deploy --project-ref YOUR_PROJECT_REF
```

After it completes, go to **Supabase → Edge Functions** — you should see all 10 functions listed as active:

- `process-application`
- `update-status`
- `mark-paid`
- `generate-lease`
- `sign-lease`
- `mark-movein`
- `send-inquiry`
- `send-message`
- `imagekit-upload`
- `get-application-status`

---

## Step 9 — Create Your Admin Account

1. Go to your live site and register an account through the normal landlord/admin registration flow
2. In Supabase → **Authentication → Users**, find your email → copy your **User UID**
3. In Supabase → **SQL Editor → New query**, run:

```sql
INSERT INTO admin_roles (user_id, email)
VALUES ('paste-your-uid-here', 'your@email.com');
```

4. Sign out and back in — you now have access to `/admin/dashboard.html`

---

## Step 10 — End-to-End Verification

Run through this checklist after setup is complete:

- [ ] Homepage loads with your company name and branding
- [ ] Property listings page loads (will be empty — that's correct)
- [ ] Address autocomplete works on the application form
- [ ] Submit a test application — you should receive two emails (applicant confirmation + admin notification)
- [ ] Log in to `/admin/dashboard.html` with your admin account
- [ ] Mark the test application as paid — applicant should receive a payment confirmation email
- [ ] Approve the test application — applicant should receive an approval email
- [ ] Generate a lease from the admin dashboard — applicant should receive a lease email
- [ ] Sign the lease as the applicant — admin should receive a lease-executed alert
- [ ] Log in to `/landlord/login.html` with your landlord account to confirm landlord portal works
- [ ] Open `/health.html` on your live site — all checks should show green

---

## Geoapify Setup (Address Autocomplete)

1. Go to **geoapify.com** → sign in → **API Keys** → create a new key
2. No special configuration needed — paste the key as `GEOAPIFY_API_KEY` in Cloudflare Pages
3. Trigger a redeploy: Cloudflare Pages → your project → **Deployments** → **Retry deployment**

The address autocomplete on the application form will activate automatically once the key is set.

---

## When You Change Domains

If you move to a different domain, update all of these — missing any one of them will break something:

| Where | What to update |
|---|---|
| Supabase → Settings → Edge Functions → Secrets | `DASHBOARD_URL` |
| Supabase → Authentication → URL Configuration | Site URL + all three Redirect URLs |
| GAS → Script Properties | `DASHBOARD_URL` |
| Cloudflare Pages → Settings → Environment variables | If your domain is embedded anywhere in config |

---

## Troubleshooting

**Build fails on Cloudflare Pages — "Missing required environment variables"**
→ `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `IMAGEKIT_URL`, or `IMAGEKIT_PUBLIC_KEY` is missing
→ Cloudflare Pages → your project → Settings → Environment variables → add the missing ones → retry deployment

**Site loads but shows "CONFIG is not defined" errors**
→ The build ran before your environment variables were set
→ Cloudflare Pages → Deployments → Retry deployment (this re-runs `generate-config.js` with your variables)

**Emails not sending — `email_logs` shows `failed`**
→ Supabase → Edge Functions → click the function name → Logs tab for the exact error message
→ Most common cause: `GAS_EMAIL_URL` is wrong or GAS hasn't been deployed yet
→ Second most common: `GAS_RELAY_SECRET` does not exactly match `RELAY_SECRET` in GAS Script Properties
→ Third: GAS daily email quota reached (100/day on free Gmail, 1,500/day on Google Workspace)

**Address autocomplete not working**
→ `GEOAPIFY_API_KEY` not set — add it in Cloudflare Pages environment variables → retry deployment

**Admin or landlord login redirects to wrong page after domain change**
→ Update redirect URLs in Supabase → Authentication → URL Configuration

**Lease signing link is broken or goes to wrong domain**
→ `DASHBOARD_URL` in Supabase Edge Function secrets is pointing to the old domain — update it there

**Images not loading**
→ `IMAGEKIT_URL` is wrong or not set in Cloudflare Pages environment variables

**Edge Functions return 500 errors**
→ Supabase → Edge Functions → click the function → Logs tab
→ Most common: `SUPABASE_ANON_KEY` not added to Edge Function secrets (Step 6)

**Landlord doesn't receive application notification**
→ The property must have a landlord assigned in the admin dashboard
→ That landlord must have an email address on their profile

---

## Summary — All Secrets and Variables

### Supabase Edge Function Secrets (Step 6)

| Secret | Required |
|---|---|
| `SUPABASE_ANON_KEY` | Yes |
| `GAS_EMAIL_URL` | Yes |
| `GAS_RELAY_SECRET` | Yes |
| `DASHBOARD_URL` | Yes |
| `ADMIN_EMAIL` | Yes |
| `IMAGEKIT_PRIVATE_KEY` | Yes (for image uploads) |
| `IMAGEKIT_URL_ENDPOINT` | Yes (for image uploads) |

### GAS Script Properties (Step 5)

| Property | Required |
|---|---|
| `RELAY_SECRET` | Yes — must match `GAS_RELAY_SECRET` exactly |
| `ADMIN_EMAILS` | Yes |
| `COMPANY_NAME` | Yes |
| `COMPANY_EMAIL` | Yes |
| `COMPANY_PHONE` | Yes |
| `DASHBOARD_URL` | Yes |

### Cloudflare Pages Environment Variables (Step 7)

| Variable | Required |
|---|---|
| `SUPABASE_URL` | Yes — build fails without it |
| `SUPABASE_ANON_KEY` | Yes — build fails without it |
| `IMAGEKIT_URL` | Yes — build fails without it |
| `IMAGEKIT_PUBLIC_KEY` | Yes — build fails without it |
| `COMPANY_NAME` | Yes |
| `COMPANY_EMAIL` | Yes |
| `COMPANY_PHONE` | Yes |
| `COMPANY_ADDRESS` | Yes |
| `ADMIN_EMAILS` | Yes |
| `GEOAPIFY_API_KEY` | Recommended |
| `COMPANY_TAGLINE` | Optional |
| `LEASE_DEFAULT_LATE_FEE_FLAT` | Optional (default: 50) |
| `LEASE_DEFAULT_LATE_FEE_DAILY` | Optional (default: 10) |
| `LEASE_DEFAULT_EXPIRY_DAYS` | Optional (default: 7) |
| `FEATURE_CO_APPLICANT` | Optional (default: enabled) |
| `FEATURE_VEHICLE_INFO` | Optional (default: enabled) |
| `FEATURE_DOCUMENT_UPLOAD` | Optional (default: enabled) |
| `FEATURE_MESSAGING` | Optional (default: enabled) |
| `FEATURE_REALTIME_UPDATES` | Optional (default: enabled) |

---

*Choice Properties · Your trust is our standard.*
