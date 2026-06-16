-- =====================================================================
-- KKSync: Desktop Admin Client Schema Setup
-- Migration Date: 2026-05-29 (Part 1)
-- Description: Sets up tables, triggers, and RPCs used by the desktop
--              admin client (programs, attendance, documents, logs).
-- =====================================================================

-- Drop existing tables to ensure schema is created fresh without conflicts
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;

-- ---------------------------------------------------------------------
-- 1. Table: programs (SK Events & Projects)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) CHECK (category IN ('Sports', 'Education', 'Environment', 'Health', 'General')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed', 'Cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. Table: attendance (Simulated & QR Check-ins)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
    youth_id UUID NOT NULL REFERENCES public.youth_profiles(id) ON DELETE CASCADE,
    time_in TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status VARCHAR(50) DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Excused')),
    scan_method VARCHAR(50) DEFAULT 'QR' CHECK (scan_method IN ('QR', 'Manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_attendance_per_event UNIQUE (program_id, youth_id)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 3. Table: announcements
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 4. Table: documents
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youth_id UUID REFERENCES public.youth_profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) CHECK (file_type IN ('ID', 'Certificate', 'Recommendation', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 5. Table: audit_logs (System Activity Logging)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    old_values JSONB,
    new_values JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- PERFORMANCE INDEXING
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_attendance_program_status ON public.attendance (program_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_youth_id ON public.attendance (youth_id);

-- ---------------------------------------------------------------------
-- ROW-LEVEL SECURITY POLICIES
-- ---------------------------------------------------------------------

-- A. PROGRAMS
CREATE POLICY "prog_admins_staff_full" ON public.programs FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "prog_authenticated_select" ON public.programs FOR SELECT TO authenticated
    USING (true);

-- B. ATTENDANCE
CREATE POLICY "att_admins_staff_full" ON public.attendance FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

-- C. AUDIT_LOGS
CREATE POLICY "al_admins_select" ON public.audit_logs FOR SELECT TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin']));

CREATE POLICY "al_allow_admin_staff_insert" ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "al_deny_client_update" ON public.audit_logs FOR UPDATE TO authenticated USING (false);
CREATE POLICY "al_deny_client_delete" ON public.audit_logs FOR DELETE TO authenticated USING (false);

-- D. ANNOUNCEMENTS
CREATE POLICY "ann_admins_staff_full" ON public.announcements FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "ann_authenticated_select" ON public.announcements FOR SELECT TO authenticated
    USING (true);

-- E. DOCUMENTS
CREATE POLICY "doc_admins_staff_full" ON public.documents FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "doc_residents_own_select" ON public.documents FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.youth_profiles WHERE public.youth_profiles.id = public.documents.youth_id AND public.youth_profiles.user_id = auth.uid()));

-- Revoke direct table grants from the anon role
REVOKE SELECT ON public.audit_logs            FROM anon;
REVOKE SELECT ON public.attendance            FROM anon;
REVOKE SELECT ON public.documents             FROM anon;

-- ---------------------------------------------------------------------
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ---------------------------------------------------------------------
CREATE TRIGGER set_updated_at_programs BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION public.process_audit_logging()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO public.audit_logs(user_id, action, table_name, old_values)
        VALUES (auth.uid(), 'DELETE', TG_TABLE_NAME, row_to_json(OLD)::jsonb);
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO public.audit_logs(user_id, action, table_name, old_values, new_values)
        VALUES (auth.uid(), 'UPDATE', TG_TABLE_NAME, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO public.audit_logs(user_id, action, table_name, new_values)
        VALUES (auth.uid(), 'INSERT', TG_TABLE_NAME, row_to_json(NEW)::jsonb);
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER audit_youth_profiles_trigger AFTER INSERT OR UPDATE OR DELETE ON public.youth_profiles FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
CREATE TRIGGER audit_programs_trigger AFTER INSERT OR UPDATE OR DELETE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
CREATE TRIGGER audit_documents_trigger AFTER INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
CREATE TRIGGER audit_attendance_trigger AFTER INSERT OR UPDATE OR DELETE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

-- ---------------------------------------------------------------------
-- COMPREHENSIVE DASHBOARD SUMMARY & ANALYTICS DATA RPC
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_dashboard_summary()
RETURNS JSONB AS $$
DECLARE
    v_total_youth INT;
    v_pending_reviews INT;
    v_active_programs INT;
    v_upcoming_events INT;
    v_attendance_rate INT;
    v_purok_data JSONB;
    v_gender_data JSONB;
    v_age_data JSONB;
    v_work_data JSONB;
    v_edu_data JSONB;
    v_recent_regs JSONB;
    v_skills_data JSONB;
    v_participation_data JSONB;
    v_classification_data JSONB;
BEGIN
    -- 1. General Metrics
    SELECT COUNT(*) INTO v_total_youth FROM public.youth_profiles WHERE status = 'Active';
    SELECT COUNT(*) INTO v_pending_reviews FROM public.registration_submissions WHERE status = 'Pending';
    SELECT COUNT(*) INTO v_active_programs FROM public.programs WHERE status = 'Active';
    SELECT COUNT(*) INTO v_upcoming_events FROM public.programs WHERE status = 'Draft';
    
    SELECT COALESCE(
        (COUNT(CASE WHEN status = 'Present' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100)::INT,
        0
    ) INTO v_attendance_rate FROM public.attendance;

    -- 2. Purok counts
    SELECT jsonb_agg(d) INTO v_purok_data FROM (
        SELECT purok, COUNT(*) as count 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY purok
    ) d;

    -- 3. Gender counts
    SELECT jsonb_agg(d) INTO v_gender_data FROM (
        SELECT gender as name, COUNT(*) as value 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY gender
    ) d;

    -- 4. Age groups
    SELECT jsonb_agg(d) INTO v_age_data FROM (
        SELECT 
            CASE 
                WHEN age >= 15 AND age <= 17 THEN 'Child Youth (15-17)'
                WHEN age >= 18 AND age <= 24 THEN 'Core Youth (18-24)'
                ELSE 'Young Adult (25-30)'
            END as group,
            COUNT(*) as count
        FROM public.youth_profiles 
        WHERE status = 'Active'
        GROUP BY 1
    ) d;

    -- 5. Work status
    SELECT jsonb_agg(d) INTO v_work_data FROM (
        SELECT COALESCE(work_status, 'Unspecified') as name, COUNT(*) as value 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY 1
    ) d;

    -- 6. Education level
    SELECT jsonb_agg(d) INTO v_edu_data FROM (
        SELECT COALESCE(education_level, 'Unspecified') as name, COUNT(*) as value 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY 1
    ) d;

    -- Classification counts
    SELECT jsonb_agg(d) INTO v_classification_data FROM (
        SELECT COALESCE(youth_classification, 'Unspecified') as name, COUNT(*) as value
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY 1
    ) d;

    -- 7. Recent registrations (limit 5)
    SELECT jsonb_agg(d) INTO v_recent_regs FROM (
        SELECT id, 
               (form_data->>'firstName') || ' ' || (form_data->>'lastName') as "fullName", 
               (form_data->>'purok') as purok, 
               (form_data->>'age')::int as age, 
               created_at as "registeredOn", 
               status
        FROM public.registration_submissions
        ORDER BY created_at DESC
        LIMIT 5
    ) d;

    -- 8. Skills counts (limit 8)
    SELECT jsonb_agg(d) INTO v_skills_data FROM (
        SELECT skill as name, COUNT(*) as value
        FROM (
            SELECT unnest(skills) as skill 
            FROM public.youth_profiles 
            WHERE status = 'Active'
        ) sub
        GROUP BY skill
        ORDER BY COUNT(*) DESC
        LIMIT 8
    ) d;

    -- 9. Program Participation counts (limit 8)
    SELECT jsonb_agg(d) INTO v_participation_data FROM (
        SELECT title as name, COALESCE((SELECT COUNT(*) FROM public.attendance WHERE program_id = p.id AND status = 'Present'), 0) as value
        FROM public.programs p
        ORDER BY start_date DESC
        LIMIT 8
    ) d;

    RETURN jsonb_build_object(
        'metrics', jsonb_build_object(
            'totalYouth', v_total_youth,
            'pendingReviews', v_pending_reviews,
            'activePrograms', v_active_programs,
            'upcomingEvents', v_upcoming_events,
            'attendanceRate', v_attendance_rate
        ),
        'purokData', COALESCE(v_purok_data, '[]'::jsonb),
        'genderData', COALESCE(v_gender_data, '[]'::jsonb),
        'ageGroupData', COALESCE(v_age_data, '[]'::jsonb),
        'workData', COALESCE(v_work_data, '[]'::jsonb),
        'educationData', COALESCE(v_edu_data, '[]'::jsonb),
        'classificationData', COALESCE(v_classification_data, '[]'::jsonb),
        'recentRegistrations', COALESCE(v_recent_regs, '[]'::jsonb),
        'skillsData', COALESCE(v_skills_data, '[]'::jsonb),
        'participationData', COALESCE(v_participation_data, '[]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- SYSTEM USER MANAGEMENT RPCS
-- ---------------------------------------------------------------------

-- 1. Get System Users
CREATE OR REPLACE FUNCTION public.get_system_users()
RETURNS TABLE (
    id UUID,
    email VARCHAR(255),
    name VARCHAR(255),
    role VARCHAR(50),
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    IF NOT public.check_user_role(auth.uid(), ARRAY['admin']) THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can list system users.';
    END IF;

    RETURN QUERY
    SELECT
        u.id,
        u.email::VARCHAR(255),
        COALESCE(r.display_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))::VARCHAR(255) AS name,
        COALESCE(r.role, 'viewer')::VARCHAR(50) AS role,
        u.created_at
    FROM auth.users u
    LEFT JOIN public.user_roles r ON u.id = r.id
    ORDER BY u.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create System User
CREATE OR REPLACE FUNCTION public.create_system_user(
    p_email TEXT,
    p_password TEXT,
    p_role TEXT,
    p_display_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_name TEXT;
BEGIN
    IF NOT public.check_user_role(auth.uid(), ARRAY['admin']) THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can create system users.';
    END IF;

    v_name := COALESCE(NULLIF(TRIM(p_display_name), ''), split_part(p_email, '@', 1));
    v_user_id := uuid_generate_v4();

    INSERT INTO auth.users (
        id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    )
    VALUES (
        v_user_id, p_email, crypt(p_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name), now(), now(), 'authenticated', 'authenticated'
    );

    INSERT INTO public.user_roles (id, role, display_name)
    VALUES (v_user_id, LOWER(p_role), v_name)
    ON CONFLICT (id) DO UPDATE SET role = LOWER(p_role), display_name = v_name;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Delete System User
CREATE OR REPLACE FUNCTION public.delete_system_user(
    p_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.check_user_role(auth.uid(), ARRAY['admin']) THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can delete system users.';
    END IF;

    IF p_id = auth.uid() THEN
        RAISE EXCEPTION 'Operation Denied: You cannot delete your own admin account.';
    END IF;

    DELETE FROM auth.users WHERE id = p_id;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update System User Role
CREATE OR REPLACE FUNCTION public.update_system_user_role(
    p_id UUID,
    p_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    IF NOT public.check_user_role(auth.uid(), ARRAY['admin']) THEN
        RAISE EXCEPTION 'Access Denied: Only administrators can modify roles.';
    END IF;

    UPDATE public.user_roles
    SET role = LOWER(p_role)
    WHERE id = p_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Backfill display_name for existing users
UPDATE public.user_roles r
SET display_name = COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
)
FROM auth.users u
WHERE r.id = u.id AND r.display_name IS NULL;
