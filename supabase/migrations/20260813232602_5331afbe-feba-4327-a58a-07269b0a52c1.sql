ALTER TABLE public.social_accounts
  DROP CONSTRAINT IF EXISTS social_accounts_profile_id_network_key,
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS display_name text,
  ADD COLUMN IF NOT EXISTS is_declared boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS declared_followers text;

CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_profile_network_handle_key
  ON public.social_accounts (profile_id, network, handle);

ALTER TABLE public.profile_metrics
  DROP CONSTRAINT IF EXISTS profile_metrics_profile_id_network_key,
  ADD COLUMN IF NOT EXISTS handle text,
  ADD COLUMN IF NOT EXISTS social_account_id uuid REFERENCES public.social_accounts(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS profile_metrics_profile_network_handle_key
  ON public.profile_metrics (profile_id, network, coalesce(handle, ''));