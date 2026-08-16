-- Removes the test admin account created before the instance_id fix was
-- applied — its row appears to be malformed enough to break GoTrue's own
-- user queries entirely (even listing all users failed). user_roles cleans
-- up automatically via its ON DELETE CASCADE on auth.users(id).
DELETE FROM auth.users WHERE email = 'admin@corum-sk.gov';
