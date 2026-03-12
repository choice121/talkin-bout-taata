-- ============================================================
-- CHOICE PROPERTIES — Security Patches
-- Run this ONCE in Supabase SQL Editor after running SCHEMA.sql
-- ============================================================


-- ── 1. Revert lease-pdfs bucket to PRIVATE ─────────────────
UPDATE storage.buckets
  SET public = false
  WHERE id = 'lease-pdfs';

DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'lease_pdfs_read_public'
  ) THEN
    EXECUTE 'DROP POLICY "lease_pdfs_read_public" ON storage.objects';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'lease_pdfs_read_auth'
  ) THEN
    EXECUTE 'CREATE POLICY "lease_pdfs_read_auth" ON storage.objects
             FOR SELECT TO authenticated
             USING (bucket_id = ''lease-pdfs'')';
  END IF;
END $$;


-- ── 2. Mask any existing SSNs already in the database ───────
UPDATE applications
  SET ssn = 'XXX-XX-' || right(regexp_replace(ssn, '\D', '', 'g'), 4)
  WHERE ssn IS NOT NULL
    AND ssn NOT LIKE 'XXX-XX-%'
    AND length(regexp_replace(ssn, '\D', '', 'g')) >= 4;

UPDATE applications
  SET co_applicant_ssn = 'XXX-XX-' || right(regexp_replace(co_applicant_ssn, '\D', '', 'g'), 4)
  WHERE co_applicant_ssn IS NOT NULL
    AND co_applicant_ssn NOT LIKE 'XXX-XX-%'
    AND length(regexp_replace(co_applicant_ssn, '\D', '', 'g')) >= 4;


-- ── 3. Add SECURITY INVOKER to admin view ───────────────────
DROP VIEW IF EXISTS admin_application_view;

CREATE VIEW admin_application_view WITH (security_invoker=on) AS
  SELECT
    a.id,
    a.app_id,
    a.created_at,
    a.updated_at,
    a.status,
    a.payment_status,
    a.payment_date,
    a.admin_notes,
    a.first_name,
    a.last_name,
    a.email,
    a.phone,
    a.property_address,
    a.property_id,
    a.landlord_id,
    a.lease_status,
    a.lease_sent_date,
    a.lease_signed_date,
    a.lease_start_date,
    a.lease_end_date,
    a.monthly_rent,
    a.security_deposit,
    a.move_in_costs,
    a.lease_late_fee_flat,
    a.lease_late_fee_daily,
    a.lease_expiry_date,
    a.tenant_signature,
    a.co_applicant_signature,
    a.has_co_applicant,
    a.co_applicant_first_name,
    a.co_applicant_last_name,
    a.co_applicant_email,
    a.move_in_status,
    a.move_in_date_actual,
    a.move_in_notes,
    a.primary_payment_method,
    a.alternative_payment_method,
    a.third_choice_payment_method,
    a.employment_status,
    a.employer,
    a.monthly_income,
    l.contact_name  AS landlord_name,
    l.business_name AS landlord_business,
    p.title         AS property_title,
    p.city          AS property_city,
    p.state         AS property_state
  FROM applications a
  LEFT JOIN landlords l ON a.landlord_id = l.id
  LEFT JOIN properties p ON a.property_id = p.id;


-- ── 4. Ensure app_id uniqueness ─────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'applications_app_id_unique'
  ) THEN
    ALTER TABLE applications
      ADD CONSTRAINT applications_app_id_unique UNIQUE (app_id);
  END IF;
END $$;


-- ── 5. Done (phase 1) ────────────────────────────────────────
SELECT 'Security patches phase 1 applied.' AS result;


-- ============================================================
-- PHASE 2 SECURITY PATCHES
-- Apply AFTER phase 1 above.
-- ============================================================


-- ── P2-1. Harden applications_public_insert ─────────────────
-- Prevents direct API callers from forging status, payment_status,
-- landlord_id, or SSN fields.  The Edge Function (process-application)
-- sets all these fields server-side, so they must arrive as NULL/default.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'applications'
      AND policyname = 'applications_public_insert'
  ) THEN
    EXECUTE 'DROP POLICY "applications_public_insert" ON applications';
  END IF;
END $$;

CREATE POLICY "applications_public_insert" ON applications
  FOR INSERT WITH CHECK (
    status          = 'pending'
    AND payment_status  = 'unpaid'
    AND landlord_id     IS NULL
    AND ssn             IS NULL
    AND co_applicant_ssn IS NULL
  );


-- ── P2-2. Restrict get_application_status() ─────────────────
-- Returns only minimal status information per Phase 1 security audit.
-- REMOVED: tenant_signature, lease_ip_address, lease_pdf_url,
--          co_applicant_email, and all financial lease terms
--          (monthly_rent, security_deposit, move_in_costs,
--           lease_late_fee_flat, lease_late_fee_daily).
-- These fields are not required for the tenant status check and
-- expose unnecessary PII / financial data to anon callers.
CREATE OR REPLACE FUNCTION get_application_status(p_app_id text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_app applications%rowtype;
  v_msgs json;
BEGIN
  SELECT * INTO v_app FROM applications WHERE app_id = p_app_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;

  SELECT json_agg(
    json_build_object(
      'sender',      sender,
      'sender_name', sender_name,
      'message',     message,
      'read',        read,
      'created_at',  created_at
    ) ORDER BY created_at ASC
  ) INTO v_msgs
  FROM messages
  WHERE app_id = p_app_id;

  RETURN json_build_object(
    'success', true,
    'application', json_build_object(
      -- Identity
      'app_id',                    v_app.app_id,
      'first_name',                v_app.first_name,
      'last_name',                 v_app.last_name,
      'email',                     v_app.email,
      -- Status fields (core purpose of this RPC)
      'status',                    v_app.status,
      'payment_status',            v_app.payment_status,
      'lease_status',              v_app.lease_status,
      -- Lease dates (non-financial, needed to show timeline on dashboard)
      'lease_expiry_date',         v_app.lease_expiry_date,
      'lease_start_date',          v_app.lease_start_date,
      'lease_end_date',            v_app.lease_end_date,
      'lease_signed_date',         v_app.lease_signed_date,
      -- Lease policy text (display-only, no financial values)
      'lease_pets_policy',         v_app.lease_pets_policy,
      'lease_smoking_policy',      v_app.lease_smoking_policy,
      'lease_compliance_snapshot', v_app.lease_compliance_snapshot,
      -- Landlord name/address on lease (no contact details)
      'lease_landlord_name',       v_app.lease_landlord_name,
      'lease_landlord_address',    v_app.lease_landlord_address,
      -- Co-applicant presence only (no email or other PII)
      'has_co_applicant',          v_app.has_co_applicant,
      'co_applicant_first_name',   v_app.co_applicant_first_name,
      'co_applicant_last_name',    v_app.co_applicant_last_name,
      'co_applicant_signature',    v_app.co_applicant_signature,
      -- Move-in
      'move_in_status',            v_app.move_in_status,
      'move_in_date_actual',       v_app.move_in_date_actual,
      -- Property info
      'property_address',          v_app.property_address,
      'desired_lease_term',        v_app.desired_lease_term,
      -- Timestamps
      'created_at',                v_app.created_at,
      'updated_at',                v_app.updated_at
      -- REMOVED: tenant_signature, lease_ip_address, lease_pdf_url
      -- REMOVED: co_applicant_email
      -- REMOVED: monthly_rent, security_deposit, move_in_costs,
      --          lease_late_fee_flat, lease_late_fee_daily
    ),
    'messages', coalesce(v_msgs, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_application_status(text) TO anon, authenticated;


-- ── P2-3. Restrict saved_properties to session isolation ─────
-- Replaces the open USING(true) policy with session_id-gated access.
-- Each browser session can only read and write its own saved rows.
-- The x-session-id header is set by the client on every Supabase request.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'saved_properties'
      AND policyname = 'saved_properties_own'
  ) THEN
    EXECUTE 'DROP POLICY "saved_properties_own" ON saved_properties';
  END IF;
END $$;

CREATE POLICY "saved_properties_session" ON saved_properties
  FOR ALL USING (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  )
  WITH CHECK (
    session_id = current_setting('request.headers', true)::json->>'x-session-id'
  );

-- Admin can manage all saved_properties rows (e.g. cleanup)
CREATE POLICY "saved_properties_admin" ON saved_properties
  FOR ALL USING (is_admin());


-- ── P2-4. Explicit grant for generate_property_id() ─────────
-- Without an explicit grant the function may be inaccessible to anon
-- callers in hardened Supabase project configurations.
GRANT EXECUTE ON FUNCTION generate_property_id() TO authenticated;


-- ── P2 Done ──────────────────────────────────────────────────
SELECT 'Security patches phase 2 applied.' AS result;


-- ── P3-1. get_lease_financials — gated financial data RPC ───
-- Returns financial lease terms only when app_id + last_name match.
-- Accepts either the primary applicant's last name or the co-applicant's
-- last name so both signing flows work with a single function call.
-- get_application_status() is deliberately left unchanged (no financial fields).
CREATE OR REPLACE FUNCTION get_lease_financials(p_app_id text, p_last_name text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_app applications%rowtype;
BEGIN
  SELECT * INTO v_app
  FROM applications
  WHERE app_id = p_app_id
    AND (
      lower(trim(last_name))             = lower(trim(p_last_name))
      OR lower(trim(co_applicant_last_name)) = lower(trim(p_last_name))
    );

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN json_build_object(
    'monthly_rent',         v_app.monthly_rent,
    'security_deposit',     v_app.security_deposit,
    'move_in_costs',        v_app.move_in_costs,
    'lease_late_fee_flat',  v_app.lease_late_fee_flat,
    'lease_late_fee_daily', v_app.lease_late_fee_daily,
    'co_applicant_email',   v_app.co_applicant_email
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_lease_financials(text, text) TO anon, authenticated;


-- ============================================================
-- PHASE 3 SECURITY PATCHES
-- Apply AFTER phase 1 and phase 2 above.
-- ============================================================


-- ── P3-1. Restrict increment_counter to properties.views_count only ──
-- Prevents attackers from incrementing arbitrary table/column counters.
CREATE OR REPLACE FUNCTION increment_counter(
  p_table  text,
  p_id     text,
  p_column text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_table != 'properties' OR p_column != 'views_count' THEN
    RAISE EXCEPTION 'Invalid counter target';
  END IF;
  UPDATE properties
    SET views_count = COALESCE(views_count, 0) + 1
    WHERE id = p_id;
END;
$$;


-- ── P3-2. Add user_id column to saved_properties ─────────
-- Required for ownership-based RLS enforcement.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'saved_properties'
      AND column_name  = 'user_id'
  ) THEN
    ALTER TABLE saved_properties ADD COLUMN user_id text;
  END IF;
END $$;


-- ── P3-3. Replace saved_properties policies with ownership enforcement ──
-- Drop all existing saved_properties policies first.
DO $$ DECLARE r record; BEGIN
  FOR r IN (
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'saved_properties'
  ) LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON saved_properties', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "saved_properties_select_own" ON saved_properties
  FOR SELECT USING (user_id = auth.uid()::text);

CREATE POLICY "saved_properties_insert_own" ON saved_properties
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

CREATE POLICY "saved_properties_delete_own" ON saved_properties
  FOR DELETE USING (user_id = auth.uid()::text);

CREATE POLICY "saved_properties_admin_all" ON saved_properties
  FOR ALL USING (is_admin());


-- ── P3-4. Restrict application-docs bucket uploads to authenticated users ──
-- Replaces the open anonymous INSERT policy with an authenticated-only policy.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'app_docs_upload'
  ) THEN
    EXECUTE 'DROP POLICY "app_docs_upload" ON storage.objects';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename  = 'objects'
      AND policyname = 'application_docs_upload'
  ) THEN
    EXECUTE 'DROP POLICY "application_docs_upload" ON storage.objects';
  END IF;
END $$;

CREATE POLICY "application_docs_upload_auth" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'application-docs');


-- ── P3-5. Add tenant_sign_token column to applications ───
-- Enables secure per-lease tenant signing verification (Fix Group 5).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'applications'
      AND column_name  = 'tenant_sign_token'
  ) THEN
    ALTER TABLE applications ADD COLUMN tenant_sign_token text;
  END IF;
END $$;


-- ── P3 Done ──────────────────────────────────────────────────
SELECT 'Security patches phase 3 applied.' AS result;


-- ── 5. Explicit WITH CHECK on properties_landlord_write ─────
-- For INSERT statements, Postgres evaluates WITH CHECK, not USING.
-- The previous policy had no WITH CHECK, so inserts relied on implicit
-- permissive fallback. This makes the constraint explicit and secure.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'properties'
      AND policyname = 'properties_landlord_write'
  ) THEN
    EXECUTE 'DROP POLICY "properties_landlord_write" ON properties';
  END IF;
END $$;

CREATE POLICY "properties_landlord_write" ON properties
  FOR ALL USING (
    landlord_id = (SELECT id FROM landlords WHERE user_id = auth.uid())
  )
  WITH CHECK (
    landlord_id = (SELECT id FROM landlords WHERE user_id = auth.uid())
  );
