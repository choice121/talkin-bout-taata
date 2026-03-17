-- ============================================================
-- Choice Properties — Security & Reliability Patch
-- Date:    2026-03-17
-- Applies: Audit findings P1, P3, P4, P5, P6, P8, P9
--
-- Run this file in:
--   Supabase Dashboard → SQL Editor → New Query → Run
--
-- Purpose:
--   Hardens the three storage policies that were too permissive,
--   adds the missing DELETE policy for application-docs, and
--   installs the pg_cron scheduled job for lease expiry.
--
-- These changes are already incorporated into SETUP.sql (Sections
-- 15 and 18). Run this patch file ONLY if you already have a live
-- database set up from an earlier version of SETUP.sql and do not
-- want to re-run the full setup. Running this patch AND the full
-- SETUP.sql is also safe — the DROP IF EXISTS guards prevent
-- duplicate-policy errors.
--
-- Prerequisites:
--   For Section 3 (pg_cron): enable the pg_cron extension first.
--     Supabase → Database → Extensions → search "pg_cron" → Enable
--   If pg_cron is not yet enabled, skip Section 3 and run it
--   separately after enabling the extension.
-- ============================================================


-- ============================================================
-- 1. STORAGE POLICY REPLACEMENTS
-- ============================================================

-- ── Drop the old, over-permissive policies ──────────────────
-- These are replaced below with tighter scoped versions.
-- Note: DROP IF EXISTS is used throughout — safe to re-run.
DROP POLICY IF EXISTS "application_docs_upload_auth" ON storage.objects;
DROP POLICY IF EXISTS "app_docs_read_auth"           ON storage.objects;
DROP POLICY IF EXISTS "application_docs_delete_own"  ON storage.objects;
DROP POLICY IF EXISTS "lease_pdfs_read_auth"         ON storage.objects;
DROP POLICY IF EXISTS "lease_pdfs_insert_auth"       ON storage.objects;

-- Also drop the new policy names in case this patch is re-run
-- after a previous partial application.
DROP POLICY IF EXISTS "application_docs_upload_own" ON storage.objects;
DROP POLICY IF EXISTS "application_docs_read_own"   ON storage.objects;
DROP POLICY IF EXISTS "lease_pdfs_read_own"         ON storage.objects;


-- ── application-docs: INSERT (Audit finding P5) ─────────────
-- Old policy: any authenticated user could upload to any path.
-- New policy: upload is restricted to the caller's own UID-prefixed
--   folder using storage.foldername(name)[1].
--
-- Storage path convention: application-docs/{auth.uid()}/{filename}
-- Frontend must prefix uploads with the user's UID folder segment.
CREATE POLICY "application_docs_upload_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'application-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ── application-docs: SELECT (gap identified in audit) ──────
-- Old policy: any authenticated user could read any document.
-- New policy: users may only read their own folder; admins read all.
--   Landlords needing document access for review should go through
--   a service-role Edge Function (bypasses RLS).
CREATE POLICY "application_docs_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'application-docs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_admin()
    )
  );


-- ── application-docs: DELETE (Audit finding P8) ─────────────
-- Previously there was no DELETE policy, making uploads permanent.
-- Users may now remove only files within their own UID folder.
CREATE POLICY "application_docs_delete_own" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'application-docs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );


-- ── lease-pdfs: SELECT (Audit finding P6) ───────────────────
-- Old policy: any authenticated user could read any lease PDF.
-- New policy: only the owning applicant or an admin may read a file.
--
-- File naming convention (set by sign-lease Edge Function):
--   lease-{app_id}-signed.html
--
-- The correlated sub-query resolves the storage object name (objects.name)
-- against the expected filename for each application the caller owns.
-- The sign-lease Edge Function uses the service-role key, which bypasses
-- RLS entirely and is not affected by this policy.
CREATE POLICY "lease_pdfs_read_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'lease-pdfs'
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1
        FROM   public.applications a
        WHERE  a.applicant_user_id = auth.uid()
          AND  objects.name = 'lease-' || a.app_id || '-signed.html'
      )
    )
  );

-- ── lease-pdfs: INSERT ───────────────────────────────────────
-- Old policy: any authenticated user could upload to lease-pdfs.
-- New policy: no permissive INSERT policy is created. The only
--   legitimate writer — the sign-lease Edge Function — uses the
--   service-role key and bypasses RLS. Removing the permissive
--   policy blocks any direct browser client upload attempt.
-- (No CREATE POLICY statement — the absence of a policy is the fix.)


-- ── Verify applied policies ──────────────────────────────────
SELECT
  policyname,
  cmd,
  roles
FROM   pg_policies
WHERE  schemaname = 'storage'
  AND  tablename  = 'objects'
ORDER  BY policyname;


-- ============================================================
-- 2. REDUNDANT RLS POLICY REMOVAL
-- ============================================================
-- landlords_own_read was shadowed entirely by landlords_public_read
-- (which uses USING (true), granting SELECT to all callers).
-- Removing the redundant policy reduces plan complexity.
DROP POLICY IF EXISTS "landlords_own_read" ON landlords;


-- ============================================================
-- 3. SCHEDULED JOB — NIGHTLY LEASE EXPIRY (Audit finding P9)
-- ============================================================
-- Prerequisite: pg_cron must be enabled before running this block.
--   Supabase → Database → Extensions → search "pg_cron" → Enable
--
-- Uses $pgcron$ dollar-quoting to avoid collision with any outer $$
-- block. The DO block is idempotent: it unschedules before rescheduling
-- so it is safe to re-run after changing the schedule expression.
DO $pgcron$
BEGIN
  -- Unschedule first so the job definition can be updated on re-runs.
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'mark-expired-leases-nightly') THEN
    PERFORM cron.unschedule('mark-expired-leases-nightly');
  END IF;

  -- Nightly at 01:00 UTC: marks any 'sent' lease past its expiry date
  -- as 'expired'. Previously this only ran when an admin loaded the
  -- Leases page. Now it runs on a real schedule regardless of admin activity.
  PERFORM cron.schedule(
    'mark-expired-leases-nightly',
    '0 1 * * *',
    'SELECT mark_expired_leases()'
  );
END $pgcron$;

-- Confirm the job was registered
SELECT jobname, schedule, command, active
FROM   cron.job
WHERE  jobname = 'mark-expired-leases-nightly';


-- ============================================================
-- DONE.
-- ============================================================
SELECT '2026-03-17 security patch applied.' AS result;
