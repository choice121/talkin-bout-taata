# Choice Properties — Secrets Setup Guide

Complete this in order. Steps 1 and 2 require you to visit external sites.
Everything else is copy-paste.

---

## Step 1 — Deploy the Google Apps Script Email Relay (~5 min)

The email relay file is already written (`GAS-EMAIL-RELAY.gs`).

1. Go to **[script.google.com](https://script.google.com)** — sign in with **choiceproperties404@gmail.com**
2. Click **New project** (top-left)
3. Delete everything in the editor, then **paste the entire contents of `GAS-EMAIL-RELAY.gs`**
4. Click the floppy disk icon (Save). Name it "Choice Properties Email Relay"
5. Click **Project Settings** (gear icon, left sidebar)
6. Scroll to **Script Properties** → click **Add script property** and add all 6 below:

| Property Name | Value |
|---|---|
| `RELAY_SECRET` | `6c49daeb39b378672570a0ab2aa455f1ae77a4fbf0cf2d67320118c0f1c16ba9` |
| `ADMIN_EMAILS` | `choiceproperties404@gmail.com` |
| `COMPANY_NAME` | `Choice Properties` |
| `COMPANY_EMAIL` | `support@choiceproperties.com` |
| `COMPANY_PHONE` | *(your business phone number)* |
| `DASHBOARD_URL` | `https://choiceproperties.com` |

7. Click **Save script properties**
8. Go back to the **Editor** tab
9. Click **Deploy → New deployment**
10. Click the gear icon next to "Select type" → choose **Web app**
11. Set:
    - Description: `Choice Properties Email Relay`
    - Execute as: **Me**
    - Who has access: **Anyone**
12. Click **Deploy** → click **Authorize access** → choose choiceproperties404@gmail.com → Allow
13. **Copy the Web App URL** — it looks like `https://script.google.com/macros/s/XXXX/exec`
    → This is your `GAS_EMAIL_URL`

---

## Step 2 — Get Your ImageKit Credentials (~2 min)

1. Go to **[imagekit.io/dashboard](https://imagekit.io/dashboard)** → sign in
2. Click **Developer options** (left sidebar)
3. You need two values:
   - **URL endpoint** → looks like `https://ik.imagekit.io/YOURNAME`  → this is `IMAGEKIT_URL_ENDPOINT`
   - **Private API key** → the key starting with `private_...` → this is `IMAGEKIT_PRIVATE_KEY`

---

## Step 3 — Set All 6 Secrets in Supabase (~3 min)

1. Go to **[supabase.com/dashboard](https://supabase.com/dashboard)** → open project **xrbovqhoinxkjecirgkq**
2. Click **Edge Functions** (left sidebar) → click **Manage secrets**
3. Add each secret below (click "Add new secret" for each):

| Secret Name | Value |
|---|---|
| `GAS_EMAIL_URL` | *(Web App URL from Step 1)* |
| `GAS_RELAY_SECRET` | `6c49daeb39b378672570a0ab2aa455f1ae77a4fbf0cf2d67320118c0f1c16ba9` |
| `DASHBOARD_URL` | `https://choiceproperties.com` |
| `ADMIN_EMAIL` | `choiceproperties404@gmail.com` |
| `IMAGEKIT_PRIVATE_KEY` | *(from Step 2)* |
| `IMAGEKIT_URL_ENDPOINT` | *(from Step 2)* |

4. After adding all 6, the changes take effect immediately — no redeployment needed.

---

## Done! ✓ Verify With a Test

Once all secrets are set, submit a test application on your live site. You should receive a confirmation email at the applicant's address within 30 seconds.

---

## Your Admin Login

| Field | Value |
|---|---|
| URL | `https://choiceproperties.com/admin/` |
| Email | `choiceproperties404@gmail.com` |
| Password | `ChoiceAdmin2024!` |

**Change your password** after first login via Supabase Dashboard → Authentication → Users.
