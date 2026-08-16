CREATE OR REPLACE FUNCTION public.__debug_meta(p_email TEXT)
RETURNS TABLE(
    raw_app_meta_data JSONB,
    raw_user_meta_data JSONB,
    email_change TEXT,
    email_change_token_current TEXT,
    phone TEXT,
    phone_change TEXT,
    reauthentication_token TEXT,
    confirmation_token TEXT,
    recovery_token TEXT,
    email_change_token_new TEXT
) AS $$
    SELECT raw_app_meta_data, raw_user_meta_data, email_change, email_change_token_current,
           phone, phone_change, reauthentication_token, confirmation_token, recovery_token, email_change_token_new
    FROM auth.users WHERE email = p_email;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

GRANT EXECUTE ON FUNCTION public.__debug_meta(TEXT) TO anon;
