-- Manually-inserted auth.users rows (setup_first_admin, create_system_user)
-- were missing instance_id, which GoTrue's login lookup filters on — a NULL
-- instance_id means the row can never match during sign-in even though the
-- row and password hash are otherwise correct ("Invalid login credentials"
-- despite a valid account existing). Fix both functions and backfill any
-- rows already created this way.

UPDATE auth.users
SET instance_id = '00000000-0000-0000-0000-000000000000'
WHERE instance_id IS NULL;

CREATE OR REPLACE FUNCTION public.setup_first_admin(
    p_email TEXT,
    p_password TEXT,
    p_display_name TEXT
)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
BEGIN
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
        RAISE EXCEPTION 'An administrator already exists. Use the login screen instead.';
    END IF;

    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id, id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, p_email, crypt(p_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', p_display_name), now(), now(), 'authenticated', 'authenticated'
    );

    INSERT INTO public.user_roles (id, role, display_name)
    VALUES (v_user_id, 'admin', p_display_name)
    ON CONFLICT (id) DO UPDATE SET role = 'admin', display_name = p_display_name;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

GRANT EXECUTE ON FUNCTION public.setup_first_admin(TEXT, TEXT, TEXT) TO anon;

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
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
        instance_id, id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, p_email, crypt(p_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name), now(), now(), 'authenticated', 'authenticated'
    );

    INSERT INTO public.user_roles (id, role, display_name)
    VALUES (v_user_id, LOWER(p_role), v_name)
    ON CONFLICT (id) DO UPDATE SET role = LOWER(p_role), display_name = v_name;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

-- diagnostic function no longer needed
DROP FUNCTION IF EXISTS public.__debug_auth_user(TEXT);

NOTIFY pgrst, 'reload schema';
