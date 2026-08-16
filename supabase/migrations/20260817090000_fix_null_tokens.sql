-- Root cause found: auth.users columns confirmation_token, recovery_token,
-- email_change, and email_change_token_new have no database default, so our
-- manual INSERT left them NULL. GoTrue's own signup path always sets these
-- to '' (empty string). GoTrue's Go code fails scanning NULL into these
-- fields with a generic "Database error querying/loading schema" — the row
-- looked structurally fine in every other way, which is why this took a
-- few rounds to isolate.

DELETE FROM auth.users WHERE email IN ('admin@corum-sk.gov', 'admincreate@gmail.com');
DROP FUNCTION IF EXISTS public.__debug_full(TEXT);
DROP FUNCTION IF EXISTS public.__debug_meta(TEXT);

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
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
        confirmation_token, recovery_token, email_change, email_change_token_new
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, p_email, crypt(p_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', p_display_name), now(), now(), 'authenticated', 'authenticated',
        '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at, last_sign_in_at)
    VALUES (
        gen_random_uuid(), v_user_id, 'email', v_user_id::text,
        jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', false, 'phone_verified', false),
        now(), now(), now()
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
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud,
        confirmation_token, recovery_token, email_change, email_change_token_new
    )
    VALUES (
        '00000000-0000-0000-0000-000000000000', v_user_id, p_email, crypt(p_password, gen_salt('bf')), now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name), now(), now(), 'authenticated', 'authenticated',
        '', '', '', ''
    );

    INSERT INTO auth.identities (id, user_id, provider, provider_id, identity_data, created_at, updated_at, last_sign_in_at)
    VALUES (
        gen_random_uuid(), v_user_id, 'email', v_user_id::text,
        jsonb_build_object('sub', v_user_id::text, 'email', p_email, 'email_verified', false, 'phone_verified', false),
        now(), now(), now()
    );

    INSERT INTO public.user_roles (id, role, display_name)
    VALUES (v_user_id, LOWER(p_role), v_name)
    ON CONFLICT (id) DO UPDATE SET role = LOWER(p_role), display_name = v_name;

    RETURN v_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

NOTIFY pgrst, 'reload schema';
