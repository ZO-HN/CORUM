-- final cleanup: remove diagnostic-only artifacts and test accounts, keep
-- the real admin account created during verification.
DROP FUNCTION IF EXISTS public.__debug_full(TEXT);
DROP FUNCTION IF EXISTS public.__debug_meta(TEXT);
DROP FUNCTION IF EXISTS public.__debug_identities(TEXT);
DROP FUNCTION IF EXISTS public.__debug_auth_user(TEXT);
DELETE FROM auth.users WHERE email = 'admincreate@gmail.com';
