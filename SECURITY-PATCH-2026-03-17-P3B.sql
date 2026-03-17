-- ============================================================
-- Choice Properties — Phase 3-B Security Patch
-- Date:    2026-03-17
-- Applies: Audit findings P5, P6 (function grant hardening)
--
-- Run this file in:
--   Supabase Dashboard → SQL Editor → New Query → Run
--
-- Purpose:
--   Revokes the 'anon' (unauthenticated) EXECUTE grant from three
--   database functions that do not need public access:
--
--   • get_apps_by_email   — called only by the get-application-status
--                           Edge Function via service role. The anon
--                           grant allowed any visitor to enumerate all
--                           applications tied to any email address.
--
--   • get_app_id_by_email — same risk profile as above.
--
--   • submit_tenant_reply — called from apply/dashboard.html, which
--                           requires the tenant to be OTP-authenticated.
--                           The anon grant allowed any unauthenticated
--                           caller who knew (or guessed) a valid app_id
--                           to inject messages into any application thread.
--
-- Safety:
--   These revokes are non-breaking for all current callers:
--     • get_apps_by_email / get_app_id_by_email: the only caller is the
--       get-application-status Edge Function, which runs as service role
--       and is unaffected by RPC grants.
--     • submit_tenant_reply: all callers are authenticated (OTP session)
--       and will continue to work under the remaining 'authenticated' grant.
--
--   Idempotent — safe to re-run; revoking a grant that doesn't exist
--   is a no-op in PostgreSQL.
-- ============================================================


-- ============================================================
-- 1. REVOKE ANON ACCESS — get_apps_by_email
-- ============================================================
-- No frontend page calls this directly. Only the Edge Function
-- (service role) uses it. The anon grant serves no purpose.
REVOKE EXECUTE ON FUNCTION get_apps_by_email(TEXT) FROM anon;


-- ============================================================
-- 2. REVOKE ANON ACCESS — get_app_id_by_email
-- ============================================================
REVOKE EXECUTE ON FUNCTION get_app_id_by_email(TEXT) FROM anon;


-- ============================================================
-- 3. REVOKE ANON ACCESS — submit_tenant_reply
-- ============================================================
-- The dashboard requires OTP login before the message form is shown.
-- The 'authenticated' grant remains intact — this only closes the
-- unauthenticated path.
REVOKE EXECUTE ON FUNCTION submit_tenant_reply(TEXT, TEXT, TEXT) FROM anon;


-- ============================================================
-- VERIFY — confirm anon no longer appears in the grant list
-- ============================================================
SELECT
  p.proname                                    AS function_name,
  r.rolname                                    AS grantee,
  HAS_FUNCTION_PRIVILEGE(r.oid, p.oid, 'EXECUTE') AS has_execute
FROM   pg_proc p
CROSS  JOIN pg_roles r
WHERE  p.proname IN ('get_apps_by_email', 'get_app_id_by_email', 'submit_tenant_reply')
  AND  r.rolname IN ('anon', 'authenticated')
ORDER  BY p.proname, r.rolname;


-- ============================================================
-- 4. DROP OPEN INSERT POLICY ON INQUIRIES (Audit finding P7)
-- ============================================================
-- The 'inquiries_public_insert' policy used WITH CHECK (true) —
-- any anonymous visitor could insert arbitrary data into the
-- inquiries table with no server-side validation.
--
-- Inquiries.submit() in cp-api.js now routes through the
-- send-inquiry Edge Function (type: 'inquiry_submit'), which:
--   • validates all fields server-side (name, email format, message length)
--   • verifies the target property is active
--   • inserts using the service role (bypasses RLS entirely)
--   • fires tenant confirmation + landlord notification emails atomically
--
-- The anon INSERT policy is no longer needed and is removed here.
-- DROP IF EXISTS makes this safe to re-run.
DROP POLICY IF EXISTS "inquiries_public_insert" ON inquiries;

-- Confirm the policy is gone
SELECT policyname, cmd, roles
FROM   pg_policies
WHERE  schemaname = 'public'
  AND  tablename  = 'inquiries'
ORDER  BY policyname;


-- ============================================================
-- DONE.
-- ============================================================
SELECT 'Phase 3-B security patch applied — anon grants revoked + inquiries insert policy removed.' AS result;
