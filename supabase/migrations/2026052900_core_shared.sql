-- =====================================================================
-- KKSync: Core & Shared Schema Setup
-- Migration Date: 2026-05-29 (Part 0)
-- Description: Sets up central tables, row-level security, triggers,
--              user roles, profiles, and basic system configuration.
-- =====================================================================

-- Drop existing tables to ensure schema is created fresh without conflicts
DROP TABLE IF EXISTS public.system_config CASCADE;
DROP TABLE IF EXISTS public.user_roles CASCADE;
DROP TABLE IF EXISTS public.youth_profiles CASCADE;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Table: user_roles (Extends Supabase auth.users)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'staff', 'resident')),
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------
-- 2. Table: youth_profiles
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- 3. Table: system_config (Barangay Details & Structure)
-- ---------------------------------------------------------------------
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

-- ---------------------------------------------------------------------
-- PERFORMANCE INDEXING
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_purok ON public.youth_profiles (status, purok);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_gender ON public.youth_profiles (status, gender);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_age ON public.youth_profiles (status, age);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_work ON public.youth_profiles (status, work_status);
CREATE INDEX IF NOT EXISTS idx_youth_profiles_status_education ON public.youth_profiles (status, education_level);

-- ---------------------------------------------------------------------
-- ROLE VERIFICATION HELPER (Avoids RLS Infinite Recursion)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_user_role(p_user_id UUID, p_roles VARCHAR[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE id = p_user_id
        AND role = ANY(p_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- ROW-LEVEL SECURITY POLICIES
-- ---------------------------------------------------------------------

-- A. YOUTH_PROFILES
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

-- B. USER_ROLES
CREATE POLICY "ur_admins_full" ON public.user_roles FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin']));

CREATE POLICY "ur_own_select" ON public.user_roles FOR SELECT TO authenticated
    USING (id = auth.uid());

-- C. SYSTEM_CONFIG
CREATE POLICY "sys_config_admins_staff_full" ON public.system_config FOR ALL TO authenticated
    USING (public.check_user_role(auth.uid(), ARRAY['admin', 'staff'])) WITH CHECK (public.check_user_role(auth.uid(), ARRAY['admin', 'staff']));

CREATE POLICY "sys_config_authenticated_select" ON public.system_config FOR SELECT TO authenticated
    USING (true);

-- Revoke direct table grants from the anon role
REVOKE SELECT ON public.youth_profiles FROM anon;
REVOKE SELECT ON public.user_roles     FROM anon;
REVOKE SELECT ON public.system_config FROM anon;

-- ---------------------------------------------------------------------
-- AUTOMATED TRIGGERS & FUNCTIONS
-- ---------------------------------------------------------------------

-- Trigger function to auto-update updated_at on record changes
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_youth_profiles BEFORE UPDATE ON public.youth_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ---------------------------------------------------------------------
-- AUTOMATED USER CREATION TRIGGER FOR USER ROLES
-- ---------------------------------------------------------------------
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------
-- SAFEGUARD TO PREVENT LOCKING OUT THE LAST SYSTEM ADMINISTRATOR
-- ---------------------------------------------------------------------
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
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER enforce_admin_presence
    BEFORE UPDATE OR DELETE ON public.user_roles
    FOR EACH ROW EXECUTE FUNCTION public.prevent_last_admin_lockout();

-- ---------------------------------------------------------------------
-- SEED DATA (System Configuration)
-- ---------------------------------------------------------------------
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
