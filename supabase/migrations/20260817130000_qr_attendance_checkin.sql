-- QR-based attendance check-in support.
--
-- Residents authenticate on the web portal via verify_resident_access (email + DOB-derived
-- passcode) and their session profile (including dob) is cached client-side. Every subsequent
-- privileged action re-derives the passcode from the cached dob and re-validates it server-side,
-- matching the existing update_resident_contacts() pattern -- this function follows the same
-- contract so residents never have to re-enter anything to check in after scanning a program QR.

CREATE OR REPLACE FUNCTION public.check_in_attendance(
    p_id UUID,
    p_email TEXT,
    p_passcode TEXT,
    p_program_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_dob DATE;
    v_email VARCHAR(150);
    v_expected_passcode TEXT;
    v_program RECORD;
    v_existing RECORD;
BEGIN
    SELECT date_of_birth, email INTO v_dob, v_email FROM public.youth_profiles WHERE id = p_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'PROFILE_NOT_FOUND');
    END IF;

    v_expected_passcode := to_char(v_dob, 'MMDDYYYY');
    IF p_passcode != v_expected_passcode OR LOWER(v_email) != LOWER(p_email) THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_SESSION');
    END IF;

    SELECT * INTO v_program FROM public.programs WHERE id = p_program_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'PROGRAM_NOT_FOUND');
    END IF;

    IF v_program.status != 'Active' THEN
        RETURN jsonb_build_object('success', false, 'error', 'PROGRAM_NOT_ACTIVE', 'programTitle', v_program.title);
    END IF;

    SELECT * INTO v_existing FROM public.attendance WHERE program_id = p_program_id AND youth_id = p_id;
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'alreadyCheckedIn', true,
            'programTitle', v_program.title,
            'timeIn', v_existing.time_in
        );
    END IF;

    INSERT INTO public.attendance (program_id, youth_id, status, scan_method)
    VALUES (p_program_id, p_id, 'Present', 'QR');

    RETURN jsonb_build_object(
        'success', true,
        'alreadyCheckedIn', false,
        'programTitle', v_program.title
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

-- Functions are executable by PUBLIC by default (no explicit REVOKE exists for this schema's
-- resident-facing RPCs), so anon can call this the same way it already calls
-- verify_resident_access / update_resident_contacts.

-- Ensure the attendance table is part of the realtime publication so the desktop Attendance
-- Logger reflects web check-ins live.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'attendance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
    END IF;
END $$;
