-- ============================================================
-- ⚠️  SUPERSEDED — DO NOT USE FOR NEW PROJECTS
-- ============================================================
-- This file has been merged into SETUP.sql.
-- All Phase 4 patches are included in SETUP.sql in their final
-- corrected state.
--
-- For new Supabase projects: run SETUP.sql only.
-- This file is kept for historical reference only.
-- ============================================================
-- PHASE 4 PATCHES (LEGACY)
-- ============================================================


-- ── Phase 2 columns — extended application fields ───────────────────────────
-- These columns are required by the process-application Edge Function.
-- Safe to re-run: ADD COLUMN IF NOT EXISTS is a no-op if already present.
alter table applications add column if not exists landlord_email               text;
alter table applications add column if not exists government_id_type            text;
alter table applications add column if not exists government_id_number          text;
alter table applications add column if not exists previous_address              text;
alter table applications add column if not exists previous_residency_duration   text;
alter table applications add column if not exists previous_landlord_name        text;
alter table applications add column if not exists previous_landlord_phone       text;
alter table applications add column if not exists has_bankruptcy                boolean default false;
alter table applications add column if not exists bankruptcy_explanation        text;
alter table applications add column if not exists has_criminal_history          boolean default false;
alter table applications add column if not exists criminal_history_explanation  text;
alter table applications add column if not exists employer_address              text;
alter table applications add column if not exists employment_start_date         text;


-- ── P4-1. get_application_status — restore admin_notes and co_applicant_email ──
-- These fields were removed in P2-2 but are required for correct tenant-facing UI:
--   • admin_notes       — shows the denial reason to a denied applicant
--   • co_applicant_email — shown in the "awaiting co-sign" callout on the dashboard
--   • lease_pdf_url     — needed to show the signed lease download button
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
      -- Status fields
      'status',                    v_app.status,
      'payment_status',            v_app.payment_status,
      'lease_status',              v_app.lease_status,
      -- Lease dates
      'lease_expiry_date',         v_app.lease_expiry_date,
      'lease_start_date',          v_app.lease_start_date,
      'lease_end_date',            v_app.lease_end_date,
      'lease_signed_date',         v_app.lease_signed_date,
      -- Lease display fields
      'lease_pets_policy',         v_app.lease_pets_policy,
      'lease_smoking_policy',      v_app.lease_smoking_policy,
      'lease_compliance_snapshot', v_app.lease_compliance_snapshot,
      'lease_landlord_name',       v_app.lease_landlord_name,
      'lease_landlord_address',    v_app.lease_landlord_address,
      -- Lease PDF path (Edge Function converts to signed URL on-demand)
      'lease_pdf_url',             v_app.lease_pdf_url,
      -- Co-applicant
      'has_co_applicant',          v_app.has_co_applicant,
      'co_applicant_first_name',   v_app.co_applicant_first_name,
      'co_applicant_last_name',    v_app.co_applicant_last_name,
      'co_applicant_email',        v_app.co_applicant_email,
      'co_applicant_signature',    v_app.co_applicant_signature,
      -- Move-in
      'move_in_status',            v_app.move_in_status,
      'move_in_date_actual',       v_app.move_in_date_actual,
      -- Property info
      'property_address',          v_app.property_address,
      'desired_lease_term',        v_app.desired_lease_term,
      -- Admin notes (shown to applicant when status = denied)
      'admin_notes',               v_app.admin_notes,
      -- Timestamps
      'created_at',                v_app.created_at,
      'updated_at',                v_app.updated_at
    ),
    'messages', coalesce(v_msgs, '[]'::json)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_application_status(text) TO anon, authenticated;


-- ── P4-2. get_lease_financials — add lease_pdf_url to gated financial data ──
-- The signed lease download button on the tenant dashboard requires lease_pdf_url.
-- Gated behind last-name verification same as the existing financial fields.
CREATE OR REPLACE FUNCTION get_lease_financials(p_app_id text, p_last_name text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_app applications%rowtype;
BEGIN
  SELECT * INTO v_app
  FROM applications
  WHERE app_id = p_app_id
    AND (
      lower(trim(last_name))                 = lower(trim(p_last_name))
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
    'co_applicant_email',   v_app.co_applicant_email,
    'lease_pdf_url',        v_app.lease_pdf_url
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_lease_financials(text, text) TO anon, authenticated;


-- ── P4-3. message_sender enum — add 'landlord' value ────────────────────────
-- The send-message Edge Function accepts sender='landlord' but the enum only
-- had 'admin' and 'tenant', causing DB insert failures for landlord messages.
ALTER TYPE message_sender ADD VALUE IF NOT EXISTS 'landlord';


-- ── P4-4. get_apps_by_email — remove status from recovery lookup ─────────────
-- The recovery lookup was returning the application status to any caller who
-- knows a person's email address (e.g. "denied"). Removing status reduces
-- privacy exposure while keeping the property/date info needed for identification.
CREATE OR REPLACE FUNCTION get_apps_by_email(p_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN (
    SELECT coalesce(json_agg(row_to_json(r) ORDER BY r.created_at DESC), '[]'::json)
    FROM (
      SELECT app_id,
             property_address,
             created_at::date AS created_at
      FROM applications
      WHERE lower(email) = lower(p_email)
    ) r
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_apps_by_email(text) TO anon, authenticated;


SELECT 'Security patches phase 4 applied.' AS result;
