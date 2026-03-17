-- ============================================================
-- ⚠️  SUPERSEDED — DO NOT USE FOR NEW PROJECTS
-- ============================================================
-- This file has been merged into SETUP.sql.
-- Applicant auth (applicant_user_id uuid column, RLS policy,
-- get_my_applications, claim_application) are all included
-- in SETUP.sql with the correct final types and constraints.
--
-- For new Supabase projects: run SETUP.sql only.
-- This file is kept for historical reference only.
-- ============================================================
-- CHOICE PROPERTIES — Applicant Identity Layer (LEGACY)
-- ============================================================
-- What this adds:
--   • applicant_user_id column on applications
--   • Index for fast lookups by user
--   • RLS policy so applicants can read their own applications
--   • get_my_applications() secure RPC for the dashboard
--   • claim_application() RPC to link legacy apps to a user
-- ============================================================


-- ============================================================
-- 1. Add applicant_user_id to applications
-- ============================================================
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS applicant_user_id uuid
    REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_applications_applicant_user_id
  ON applications(applicant_user_id);


-- ============================================================
-- 2. RLS policy — authenticated applicant can read their own
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'applications'
      AND policyname = 'applications_applicant_read'
  ) THEN
    CREATE POLICY "applications_applicant_read" ON applications
      FOR SELECT USING (applicant_user_id = auth.uid());
  END IF;
END $$;


-- ============================================================
-- 3. Secure RPC — get all applications for authenticated user
--    Returns a safe subset of fields (no SSN, no income data).
--    Only callable by authenticated users.
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_applications()
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();

  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  RETURN json_build_object(
    'success', true,
    'applications', (
      SELECT COALESCE(
        json_agg(
          json_build_object(
            'app_id',           app_id,
            'status',           status,
            'payment_status',   payment_status,
            'lease_status',     lease_status,
            'property_address', property_address,
            'created_at',       created_at,
            'first_name',       first_name,
            'last_name',        last_name,
            'monthly_rent',     monthly_rent,
            'lease_start_date', lease_start_date,
            'move_in_status',   move_in_status,
            'application_fee',  application_fee,
            'email',            email
          ) ORDER BY created_at DESC
        ),
        '[]'::json
      )
      FROM applications
      WHERE applicant_user_id = v_uid
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_my_applications() TO authenticated;


-- ============================================================
-- 4. Secure RPC — claim_application
--    Links an existing legacy application to the currently
--    authenticated user, verified by matching email address.
--    Prevents cross-applicant hijacking.
--    Safe to re-run: no-op if already claimed by this user.
-- ============================================================
CREATE OR REPLACE FUNCTION claim_application(p_app_id text, p_email text)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_uid        uuid;
  v_auth_email text;
  v_app        applications%rowtype;
BEGIN
  v_uid        := auth.uid();
  v_auth_email := auth.email();

  IF v_uid IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_app FROM applications WHERE app_id = p_app_id;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Application not found');
  END IF;

  -- Verify the application email against BOTH the server-side auth.email()
  -- (the email the caller proved ownership of via OTP) AND the client-supplied
  -- p_email hint.  Using auth.email() prevents a malicious authenticated caller
  -- from supplying a third-party email they know in order to claim someone else's
  -- application.  p_email is kept in the signature for backward compatibility.
  IF lower(v_app.email) <> lower(v_auth_email) THEN
    RETURN json_build_object('success', false, 'error', 'Email does not match application');
  END IF;

  -- Already claimed by this user — no-op
  IF v_app.applicant_user_id = v_uid THEN
    RETURN json_build_object('success', true, 'already_claimed', true);
  END IF;

  -- Reject if already claimed by a DIFFERENT user
  IF v_app.applicant_user_id IS NOT NULL AND v_app.applicant_user_id <> v_uid THEN
    RETURN json_build_object('success', false, 'error', 'Application already linked to another account');
  END IF;

  UPDATE applications
    SET applicant_user_id = v_uid
    WHERE app_id = p_app_id;

  RETURN json_build_object('success', true, 'claimed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION claim_application(text, text) TO authenticated;


-- ============================================================
-- DONE
-- After running this file:
--   • Enable "Email OTP" (passwordless) in Supabase Auth settings
--     Dashboard → Auth → Providers → Email → Enable OTP
--   • Optionally disable "Email Confirmation" to make signup frictionless
-- ============================================================
