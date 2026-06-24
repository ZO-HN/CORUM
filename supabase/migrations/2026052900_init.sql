-- kksync initial db migration (2026-05-29)

-- wipe tables to start fresh
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.documents CASCADE;
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.registration_submissions CASCADE;
DROP TABLE IF EXISTS public.attendance CASCADE;
DROP TABLE IF EXISTS public.programs CASCADE;
DROP TABLE IF EXISTS public.youth_profiles CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;

-- enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- core / shared tables

-- user roles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'resident')),
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- resident profiles
CREATE TABLE IF NOT EXISTS public.youth_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    age INT NOT NULL CHECK (age >= 15 AND age <= 30),
    gender VARCHAR(50) CHECK (gender IN ('Male', 'Female', 'LGBTQIA+', 'Unlabeled')),
    date_of_birth DATE NOT NULL,
    civil_status VARCHAR(50) DEFAULT 'Single' CHECK (civil_status IN ('Single', 'Married', 'Widowed')),
    blood_type VARCHAR(10) DEFAULT 'O+',
    nationality VARCHAR(100) DEFAULT 'Filipino',
    contact_number VARCHAR(30),
    email VARCHAR(150) UNIQUE CHECK (email IS NULL OR position('@' in email) > 0),
    additional_email VARCHAR(150),
    home_address TEXT NOT NULL,
    purok VARCHAR(50) NOT NULL,
    is_registered_voter BOOLEAN DEFAULT FALSE,
    precinct_number VARCHAR(50),
    education_level TEXT,
    scholarship_status VARCHAR(100) DEFAULT 'None',
    youth_classification VARCHAR(100),
    work_status VARCHAR(100),
    work_specify TEXT,
    education_background VARCHAR(100),
    education_specify TEXT,
    has_scholarship VARCHAR(50),
    scholarship_specify TEXT,
    participated_last_kk_election VARCHAR(50),
    attended_kk_assembly VARCHAR(50),
    kk_assembly_count INT,
    skills TEXT[] DEFAULT '{}',
    facebook_link TEXT,
    profile_picture_url TEXT,
    status VARCHAR(50) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Archived')),
    joined_date DATE DEFAULT CURRENT_DATE,
    otp_code VARCHAR(6),
    educational_status VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.youth_profiles ENABLE ROW LEVEL SECURITY;

-- barangay details & system config
CREATE TABLE IF NOT EXISTS public.system_config (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    barangay_name VARCHAR(255) DEFAULT 'San Antonio',
    barangay_logo TEXT,
    sk_chairperson VARCHAR(255) DEFAULT 'Hon. Jane Doe',
    puroks VARCHAR(255)[] DEFAULT '{}',
    sk_kagawads VARCHAR(255)[] DEFAULT '{}',
    sk_treasurer VARCHAR(255),
    sk_secretary VARCHAR(255),
    district VARCHAR(255) DEFAULT 'District I',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;


-- desktop admin tables

-- programs (projects, events, seminars)
CREATE TABLE IF NOT EXISTS public.programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100) CHECK (category IN ('Sports', 'Education', 'Environment', 'Health', 'General')),
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Completed', 'Cancelled')),
    budget NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

-- attendance check-ins
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

-- announcements
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) DEFAULT 'General',
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- uploaded verification documents
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    youth_id UUID REFERENCES public.youth_profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(100) CHECK (file_type IN ('ID', 'Certificate', 'Recommendation', 'Other')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- audit logs
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


-- web resident portal tables

-- self-registration queue
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


-- performance indexes
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_purok ON public.youth_profiles (status, purok);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_gender ON public.youth_profiles (status, gender);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_age ON public.youth_profiles (status, age);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_work ON public.youth_profiles (status, work_status);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_education ON public.youth_profiles (status, education_level);
CREATE INDEX IF NOT EXISTS idx_attendance_program_status ON public.attendance (program_id, status);
CREATE INDEX IF NOT EXISTS idx_attendance_youth_id ON public.attendance (youth_id);
CREATE INDEX IF NOT EXISTS idx_registration_submissions_status ON public.registration_submissions (status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_youth_profiles_lower_email ON public.youth_profiles (LOWER(email));
CREATE INDEX IF NOT EXISTS idx_youth_profiles_user_id ON public.youth_profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_programs_start_date ON public.programs (start_date);
CREATE INDEX IF NOT EXISTS idx_registration_submissions_created_at ON public.registration_submissions (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_documents_youth_id ON public.documents (youth_id);
CREATE INDEX IF NOT EXISTS idx_registration_submissions_reviewed_by ON public.registration_submissions (reviewed_by);
CREATE INDEX IF NOT EXISTS idx_registration_submissions_form_data_email ON public.registration_submissions ((LOWER(form_data->>'email')));


-- rls policies

-- checks roles without infinite recursion
CREATE OR REPLACE FUNCTION public.check_user_role(p_user_id UUID, p_roles VARCHAR[])
RETURNS BOOLEAN AS $$
BEGIN
    -- Prevent checking other users' roles unless the caller is an admin
    IF p_user_id <> auth.uid() AND NOT EXISTS (
        SELECT 1 FROM public.user_roles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RETURN FALSE;
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE id = p_user_id
        AND role = ANY(p_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- core / shared table policies

-- youth profiles
CREATE POLICY "yp_admins_full_access" ON public.youth_profiles FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin']));

CREATE POLICY "yp_staff_select" ON public.youth_profiles FOR SELECT TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['staff']));

CREATE POLICY "yp_staff_update" ON public.youth_profiles FOR UPDATE TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['staff']));

CREATE POLICY "yp_staff_insert" ON public.youth_profiles FOR INSERT TO authenticated
    WITH CHECK (public.check_user_role(auth.uid(), ARRAY['staff']));

CREATE POLICY "yp_residents_own_select" ON public.youth_profiles FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- user roles
CREATE POLICY "ur_admins_full" ON public.user_roles FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin']));

CREATE POLICY "ur_own_select" ON public.user_roles FOR SELECT TO authenticated
    USING (id = auth.uid());

-- system config
CREATE POLICY "sys_config_admins_staff_full" ON public.system_config FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "sys_config_authenticated_select" ON public.system_config FOR SELECT TO authenticated
    USING (true);

-- desktop admin policies

-- programs
CREATE POLICY "prog_admins_staff_full" ON public.programs FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "prog_authenticated_select" ON public.programs FOR SELECT TO authenticated
    USING (true);

-- attendance
CREATE POLICY "att_admins_staff_full" ON public.attendance FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

-- audit logs
CREATE POLICY "al_admins_select" ON public.audit_logs FOR SELECT TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin']));

CREATE POLICY "al_allow_admin_staff_insert" ON public.audit_logs FOR INSERT TO authenticated
    WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "al_deny_client_update" ON public.audit_logs FOR UPDATE TO authenticated USING (false);
CREATE POLICY "al_deny_client_delete" ON public.audit_logs FOR DELETE TO authenticated USING (false);

-- announcements
CREATE POLICY "ann_admins_staff_full" ON public.announcements FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "ann_authenticated_select" ON public.announcements FOR SELECT TO authenticated
    USING (true);

-- documents
CREATE POLICY "doc_admins_staff_full" ON public.documents FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "doc_residents_own_select" ON public.documents FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM public.youth_profiles WHERE public.youth_profiles.id = public.documents.youth_id AND public.youth_profiles.user_id = auth.uid()));

-- web resident policies

-- registration submissions
CREATE POLICY "rs_anon_insert" ON public.registration_submissions FOR INSERT TO anon
    WITH CHECK (true);

CREATE POLICY "rs_admins_staff_full" ON public.registration_submissions FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

-- table grants and security cleanups
REVOKE SELECT ON public.youth_profiles        FROM anon;
REVOKE SELECT ON public.audit_logs            FROM anon;
REVOKE SELECT ON public.user_roles            FROM anon;
REVOKE SELECT ON public.attendance            FROM anon;
REVOKE SELECT ON public.documents             FROM anon;
REVOKE SELECT ON public.registration_submissions FROM anon;
REVOKE SELECT ON public.system_config         FROM anon;

GRANT INSERT ON public.registration_submissions TO anon;


-- triggers

-- updates updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

CREATE TRIGGER set_updated_at_youth_profiles BEFORE UPDATE ON public.youth_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_programs BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER set_updated_at_registration_submissions BEFORE UPDATE ON public.registration_submissions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- logs changes to audit table
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

CREATE TRIGGER audit_youth_profiles_trigger AFTER INSERT OR UPDATE OR DELETE ON public.youth_profiles FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
CREATE TRIGGER audit_programs_trigger AFTER INSERT OR UPDATE OR DELETE ON public.programs FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
CREATE TRIGGER audit_registration_submissions_trigger AFTER INSERT OR UPDATE OR DELETE ON public.registration_submissions FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
CREATE TRIGGER audit_documents_trigger AFTER INSERT OR UPDATE OR DELETE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();
CREATE TRIGGER audit_attendance_trigger AFTER INSERT OR UPDATE OR DELETE ON public.attendance FOR EACH ROW EXECUTE FUNCTION public.process_audit_logging();

-- assigns default role to new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_has_users BOOLEAN;
    v_display_name TEXT;
BEGIN
    v_display_name := COALESCE(
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'name',
        split_part(new.email, '@', 1)
    );

    SELECT EXISTS (SELECT 1 FROM public.user_roles) INTO v_has_users;
    IF v_has_users THEN
        INSERT INTO public.user_roles (id, role, display_name) VALUES (new.id, 'staff', v_display_name);
    ELSE
        INSERT INTO public.user_roles (id, role, display_name) VALUES (new.id, 'admin', v_display_name);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- prevents removing the last admin
CREATE OR REPLACE FUNCTION public.prevent_last_admin_lockout()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE' AND OLD.role = 'admin') OR (TG_OP = 'UPDATE' AND OLD.role = 'admin' AND NEW.role != 'admin') THEN
        IF (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') <= 1 THEN
            RAISE EXCEPTION 'Operation aborted. The system must have at least one active administrator.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_catalog;

CREATE OR REPLACE TRIGGER enforce_admin_presence
    BEFORE UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_lockout();


-- rpc helpers

-- web resident helper functions

-- verifies resident status and password
CREATE OR REPLACE FUNCTION public.verify_resident_access(p_email TEXT, p_passcode TEXT)
RETURNS JSONB AS $$
DECLARE
    v_profile RECORD;
    v_submission RECORD;
    v_expected_passcode TEXT;
    v_attendance_logs JSONB;
    v_participation_rate INT;
    v_profile_json JSONB;
BEGIN
    -- look in profiles
    SELECT * INTO v_profile FROM public.youth_profiles WHERE LOWER(email) = LOWER(p_email) LIMIT 1;
    IF FOUND THEN
        v_expected_passcode := to_char(v_profile.date_of_birth, 'MMDDYYYY');
        IF p_passcode = v_expected_passcode OR (v_profile.otp_code IS NOT NULL AND p_passcode = v_profile.otp_code) THEN
            -- Fetch attendance logs
            SELECT COALESCE(
                (SELECT jsonb_agg(jsonb_build_object(
                    'programTitle', pr.title,
                    'role', 'Participant',
                    'date', to_char(pr.start_date, 'Mon YYYY'),
                    'status', CASE WHEN pr.status = 'Completed' THEN 'Completed' ELSE 'In Progress' END
                ) ORDER BY pr.start_date DESC)
                FROM public.attendance a
                JOIN public.programs pr ON a.program_id = pr.id
                WHERE a.youth_id = v_profile.id),
                '[]'::jsonb
            ) INTO v_attendance_logs;

            -- Calculate participation rate
            SELECT COALESCE(
                (SELECT (COUNT(CASE WHEN a.status = 'Present' THEN 1 END)::FLOAT / NULLIF(COUNT(DISTINCT pr.id), 0) * 100)::INT
                 FROM public.programs pr
                 LEFT JOIN public.attendance a ON pr.id = a.program_id AND a.youth_id = v_profile.id
                 WHERE pr.status IN ('Active', 'Completed')),
                0
            ) INTO v_participation_rate;

            -- Strip sensitive otp_code and append logs/rate
            v_profile_json := row_to_json(v_profile)::jsonb - 'otp_code' || jsonb_build_object(
                'attendance_logs', v_attendance_logs,
                'participation_rate', v_participation_rate
            );

            RETURN jsonb_build_object(
                'type', 'synced_profile',
                'profile', v_profile_json
            );
        END IF;
    END IF;

    -- look in pending submissions
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- updates phone/email with passcode check
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- desktop admin helpers

-- dashboard statistics aggregation
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
    -- general metrics
    SELECT COUNT(*) INTO v_total_youth FROM public.youth_profiles WHERE status = 'Active';
    SELECT COUNT(*) INTO v_pending_reviews FROM public.registration_submissions WHERE status = 'Pending';
    SELECT COUNT(*) INTO v_active_programs FROM public.programs WHERE status = 'Active';
    SELECT COUNT(*) INTO v_upcoming_events FROM public.programs WHERE status = 'Draft';
    
    SELECT COALESCE(
        (COUNT(CASE WHEN status = 'Present' THEN 1 END)::FLOAT / NULLIF(COUNT(*), 0) * 100)::INT,
        0
    ) INTO v_attendance_rate FROM public.attendance;

    -- count by purok
    SELECT jsonb_agg(d) INTO v_purok_data FROM (
        SELECT purok, COUNT(*) as count 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY purok
    ) d;

    -- count by gender
    SELECT jsonb_agg(d) INTO v_gender_data FROM (
        SELECT gender as name, COUNT(*) as value 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY gender
    ) d;

    -- age distribution
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

    -- work status counts
    SELECT jsonb_agg(d) INTO v_work_data FROM (
        SELECT COALESCE(work_status, 'Unspecified') as name, COUNT(*) as value 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY 1
    ) d;

    -- education level counts
    SELECT jsonb_agg(d) INTO v_edu_data FROM (
        SELECT COALESCE(education_level, 'Unspecified') as name, COUNT(*) as value 
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY 1
    ) d;

    -- youth classifications
    SELECT jsonb_agg(d) INTO v_classification_data FROM (
        SELECT COALESCE(youth_classification, 'Unspecified') as name, COUNT(*) as value
        FROM public.youth_profiles 
        WHERE status = 'Active' 
        GROUP BY 1
    ) d;

    -- last 5 signups
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

    -- top 8 skills
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

    -- attendance rate per event
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- list users (admin only)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- add user (admin only)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- delete user (admin only)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- update role (admin only)
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- backfill missing display names
UPDATE public.user_roles r
SET display_name = COALESCE(
    u.raw_user_meta_data->>'full_name',
    u.raw_user_meta_data->>'name',
    split_part(u.email, '@', 1)
)
FROM auth.users u
WHERE r.id = u.id AND r.display_name IS NULL;


-- seed initial config
INSERT INTO public.system_config (
    id, barangay_name, sk_chairperson, puroks, sk_kagawads, sk_treasurer, sk_secretary, district, updated_at
) 
VALUES (
    1, 'San Antonio', 'Hon. Jane Doe', 
    ARRAY['East', 'West A', 'West B', 'Holy Cross Drive', 'Special Block', 'Belisario', 'Ibula', 'Puting Lupa', 'Ruiz', 'Sto. Niño A', 'Sto. Niño B', 'Freedom', 'Fatima', 'San Vicente', 'Green Village', 'Gosi Blaza'], 
    ARRAY['Kagawad 1', 'Kagawad 2', 'Kagawad 3', 'Kagawad 4', 'Kagawad 5', 'Kagawad 6', 'Kagawad 7'], 
    'Treasurer', 'Secretary', 'District I', now()
)
ON CONFLICT (id) DO UPDATE 
SET 
    puroks = COALESCE(NULLIF(public.system_config.puroks, '{}'::VARCHAR[]), ARRAY['East', 'West A', 'West B', 'Holy Cross Drive', 'Special Block', 'Belisario', 'Ibula', 'Puting Lupa', 'Ruiz', 'Sto. Niño A', 'Sto. Niño B', 'Freedom', 'Fatima', 'San Vicente', 'Green Village', 'Gosi Blaza']),
    sk_kagawads = COALESCE(NULLIF(public.system_config.sk_kagawads, '{}'::VARCHAR[]), ARRAY['Kagawad 1', 'Kagawad 2', 'Kagawad 3', 'Kagawad 4', 'Kagawad 5', 'Kagawad 6', 'Kagawad 7']),
    updated_at = now();
