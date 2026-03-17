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
-- DONE.
-- ============================================================
SELECT 'Phase 3-B security patch applied — anon grants revoked.' AS result;
