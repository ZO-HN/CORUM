-- temporary diagnostic function, will be dropped after use
CREATE OR REPLACE FUNCTION public.__debug_auth_user(p_email TEXT)
RETURNS TABLE(
    instance_id UUID,
    aud TEXT,
    role TEXT,
    email_confirmed_at TIMESTAMPTZ,
    confirmation_token TEXT,
    recovery_token TEXT,
    email_change TEXT,
    email_change_token_new TEXT,
    is_sso_user BOOLEAN,
    is_anonymous BOOLEAN,
    encrypted_password_prefix TEXT
) AS $$
    SELECT
        u.instance_id, u.aud, u.role, u.email_confirmed_at,
        u.confirmation_token, u.recovery_token, u.email_change, u.email_change_token_new,
        u.is_sso_user, u.is_anonymous,
        left(u.encrypted_password, 7)
    FROM auth.users u
    WHERE u.email = p_email;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

GRANT EXECUTE ON FUNCTION public.__debug_auth_user(TEXT) TO anon;
