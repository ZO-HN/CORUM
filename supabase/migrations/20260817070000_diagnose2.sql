CREATE OR REPLACE FUNCTION public.__debug_full(p_email TEXT)
RETURNS TABLE(
    u_id UUID, u_instance_id UUID, u_aud TEXT, u_role TEXT,
    u_confirmed TIMESTAMPTZ, u_pw_prefix TEXT, u_deleted_at TIMESTAMPTZ,
    u_is_sso BOOLEAN, u_banned_until TIMESTAMPTZ,
    i_count BIGINT
) AS $$
    SELECT
        u.id, u.instance_id, u.aud, u.role, u.email_confirmed_at,
        left(u.encrypted_password, 7), u.deleted_at, u.is_sso_user, u.banned_until,
        (SELECT count(*) FROM auth.identities i WHERE i.user_id = u.id)
    FROM auth.users u
    WHERE u.email = p_email;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

GRANT EXECUTE ON FUNCTION public.__debug_full(TEXT) TO anon;
