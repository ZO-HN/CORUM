-- =====================================================================
-- KKSync: Web Resident Client Schema Setup
-- Migration Date: 2026-05-29 (Part 2)
-- Description: Sets up tables, triggers, and RPCs used by the public web
--              resident registration portal (submissions, verification).
-- =====================================================================

-- Drop existing tables to ensure schema is created fresh without conflicts
DROP TABLE IF EXISTS public.registration_submissions CASCADE;

-- ---------------------------------------------------------------------
-- 1. Table: registration_submissions (Web Registry Requests)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registration_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_data JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
    reviewer_notes TEXT,
    reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_submission_form_data CHECK (
        jsonb_typeof(form_data->'email') = 'string' AND
        position('@' in (form_data->>'email')) > 0 AND
        jsonb_typeof(form_data->'firstName') = 'string' AND
        jsonb_typeof(form_data->'lastName') = 'string' AND
        (form_data->>'age')::int >= 15 AND 
        (form_data->>'age')::int <= 30
    )
);

ALTER TABLE public.registration_submissions ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- PERFORMANCE INDEXING
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_registration_submissions_status ON public.registration_submissions (status);

-- ---------------------------------------------------------------------
-- ROW-LEVEL SECURITY POLICIES
-- ---------------------------------------------------------------------
CREATE POLICY "rs_anon_insert" ON public.registration_submissions FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "rs_admins_staff_full" ON public.registration_submissions FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

-- Revoke select and grant insert permissions on submissions
REVOKE SELECT ON public.registration_submissions FROM anon;
GRANT INSERT ON public.registration_submissions TO anon;

-- ---------------------------------------------------------------------
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ---------------------------------------------------------------------
CREATE TRIGGER set_updated_at_registration_submissions BEFORE UPDATE ON public.registration_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER audit_registration_submissions_trigger AFTER INSERT OR UPDATE OR DELETE ON public.registration_submissions FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

-- ---------------------------------------------------------------------
-- RESIDENT ACCESS VERIFICATION RPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.verify_resident_access(p_email TEXT, p_passcode TEXT)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_submission RECORD;
    v_expected_passcode TEXT;
BEGIN
    -- 1. Try to find in youth_profiles
    SELECT * INTO v_profile FROM public.youth_profiles WHERE LOWER(email) = LOWER(p_email) LIMIT 1;
    IF FOUND THEN
        v_expected_passcode := to_char(v_profile.date_of_birth, 'MMDDYYYY');
        IF p_passcode = v_expected_passcode OR (v_profile.otp_code IS NOT NULL AND p_passcode = v_profile.otp_code) THEN
            RETURN jsonb_build_object(
                'type', 'synced_profile',
                'profile', row_to_json(v_profile)::jsonb
            );
        END IF;
    END IF;

    -- 2. Try to find in registration_submissions
    SELECT * INTO v_submission FROM public.registration_submissions WHERE LOWER(form_data->>'email') = LOWER(p_email) LIMIT 1;
    IF FOUND THEN
        v_expected_passcode := to_char(to_date(v_submission.form_data->>'dob', 'YYYY-MM-DD'), 'MMDDYYYY');
        IF p_passcode = v_expected_passcode THEN
            RETURN jsonb_build_object(
                'type', 'pending_submission',
                'submission', row_to_json(v_submission)::jsonb
            );
        END IF;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- SECURE RESIDENT CONTACT UPDATE WORKFLOW RPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_resident_contacts(
    p_id UUID,
    p_email TEXT,
    p_passcode TEXT,
    p_new_phone TEXT,
    p_new_email TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_expected_passcode TEXT;
    v_dob DATE;
    v_email VARCHAR(150);
BEGIN
    SELECT date_of_birth, email INTO v_dob, v_email FROM public.youth_profiles WHERE id = p_id;
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    v_expected_passcode := to_char(v_dob, 'MMDDYYYY');
    IF p_passcode != v_expected_passcode OR LOWER(v_email) != LOWER(p_email) THEN
        RETURN FALSE;
    END IF;

    UPDATE public.youth_profiles
    SET contact_number = p_new_phone,
        additional_email = p_new_email
    WHERE id = p_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
