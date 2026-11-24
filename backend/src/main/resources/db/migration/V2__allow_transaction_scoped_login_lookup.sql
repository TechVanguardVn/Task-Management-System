-- The trusted backend may look up exactly one normalized email before verifying
-- its password. This SELECT-only policy does not allow unauthenticated writes.
-- Both context settings are transaction-local and never taken from JWT claims
-- until signature/claims verification has completed.
CREATE POLICY users_login_lookup ON public.users FOR SELECT
    USING (email = nullif(current_setting('app.login_email', true), ''));
