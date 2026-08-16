-- Removes the test super admin account created during setup verification,
-- so the app's Sign Up flow reappears for the real first-time setup.
DELETE FROM auth.users WHERE email = 'admin@corum-sk.gov';
