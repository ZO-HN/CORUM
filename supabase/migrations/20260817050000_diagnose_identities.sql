CREATE OR REPLACE FUNCTION public.__debug_identities(p_email TEXT)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    provider TEXT,
    provider_id TEXT,
    identity_data JSONB
) AS $$
    SELECT i.id, i.user_id, i.provider, i.provider_id, i.identity_data
    FROM auth.identities i
    WHERE i.email = p_email;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public, extensions, pg_catalog;

GRANT EXECUTE ON FUNCTION public.__debug_identities(TEXT) TO anon;
