-- system_config only holds public branding info (barangay name/logo, SK
-- officials, puroks) — no PII — and the public web portal needs to read it
-- before login to show branding. Previously anon was explicitly revoked
-- from it, breaking the web app's pre-login config fetch.
CREATE POLICY "sys_config_anon_select" ON public.system_config FOR SELECT TO anon
    USING (true);

GRANT SELECT ON public.system_config TO anon;
