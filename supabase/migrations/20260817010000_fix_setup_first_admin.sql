-- Fixes any_admin_exists()/setup_first_admin(), which a stale migration
-- (20260817000000_first_admin_setup.sql, now removed) re-created with the
-- unfixed uuid_generate_v4() and without "extensions" in its search_path —
-- overwriting the corrected versions from 2026052900_init.sql.

CREATE OR REPLACE FUNCTION public.any_admin_exists()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

GRANT EXECUTE ON FUNCTION public.any_admin_exists() TO anon, authenticated;

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
        id, email, encrypted_password, email_confirmed_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
    )
    VALUES (
        v_user_id, p_email, crypt(p_password, gen_salt('bf')), now(),
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

NOTIFY pgrst, 'reload schema';
