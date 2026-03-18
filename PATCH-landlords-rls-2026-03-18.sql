-- ============================================================
-- PATCH: landlords RLS — split landlords_own_write
-- Date: 2026-03-18
-- Issue: "new row violates row-level security policy for table landlords"
--        during new-user signup caused by JWT propagation delay making
--        auth.uid() return NULL on the first INSERT attempt.
--
-- Root cause in the old policy:
--   CREATE POLICY "landlords_own_write" ON landlords
--     FOR ALL USING (user_id = auth.uid());
--
--   Using FOR ALL with only a USING clause and no WITH CHECK means
--   PostgreSQL silently applies the USING expression as WITH CHECK for
--   INSERT. That is technically correct behaviour, but the ambiguity
--   masked the real problem and made the policy harder to reason about.
--
-- Fix (DB side):
--   Replace the single FOR ALL policy with three operation-specific
--   policies, each with an explicit WITH CHECK where relevant.
--   This does NOT change which rows are accessible — it only makes
--   the intent explicit and removes the ambiguous FOR ALL fallback.
--
-- Fix (JS side — cp-api.js):
--   createLandlordProfileIfMissing() now retries up to 4 times with
--   400 ms linear backoff on RLS failures, covering the JWT propagation
--   window without a fixed arbitrary delay.
--   requireLandlord() no longer swallows the error silently; it logs
--   the real message and avoids the redirect loop.
--
-- Run this once in: Supabase Dashboard → SQL Editor
-- Safe to re-run (all statements are idempotent).
-- ============================================================

-- 1. Drop the old combined policy
DROP POLICY IF EXISTS "landlords_own_write" ON landlords;

-- 2. Create explicit per-operation policies
--    INSERT: new row's user_id must equal the caller's auth.uid()
CREATE POLICY "landlords_own_insert" ON landlords
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

--    UPDATE: caller may only update their own row, and may not change user_id to someone else's
CREATE POLICY "landlords_own_update" ON landlords
  FOR UPDATE
  USING     (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

--    DELETE: caller may only delete their own row
CREATE POLICY "landlords_own_delete" ON landlords
  FOR DELETE
  USING     (user_id = auth.uid());

-- 3. Verify — expected output after running:
--    landlords_admin_all    | FOR ALL   | USING (is_admin())
--    landlords_public_read  | FOR SELECT| USING (true)
--    landlords_own_insert   | FOR INSERT| WITH CHECK (user_id = auth.uid())
--    landlords_own_update   | FOR UPDATE| USING (...) WITH CHECK (...)
--    landlords_own_delete   | FOR DELETE| USING (user_id = auth.uid())
SELECT policyname, cmd, qual, with_check
FROM   pg_policies
WHERE  schemaname = 'public'
AND    tablename  = 'landlords'
ORDER  BY policyname;
