CREATE TYPE public.metric_source AS ENUM ('manual', 'api');
CREATE TYPE public.sync_status AS ENUM ('never', 'ok', 'error', 'pending');

ALTER TABLE public.profile_metrics
  ADD COLUMN source public.metric_source NOT NULL DEFAULT 'manual',
  ADD COLUMN verified_at timestamp with time zone;

CREATE TABLE public.social_accounts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  network public.social_network NOT NULL,
  provider text NOT NULL DEFAULT 'insightiq',
  provider_account_id text,
  provider_user_id text,
  handle text,
  profile_url text,
  connected_at timestamp with time zone NOT NULL DEFAULT now(),
  last_synced_at timestamp with time zone,
  sync_status public.sync_status NOT NULL DEFAULT 'never',
  sync_error text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (profile_id, network)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_accounts TO authenticated;
GRANT SELECT ON public.social_accounts TO anon;
GRANT ALL ON public.social_accounts TO service_role;

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social accounts"
  ON public.social_accounts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = social_accounts.profile_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = social_accounts.profile_id AND p.user_id = auth.uid()));

CREATE POLICY "Admins can manage all social accounts"
  ON public.social_accounts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read approved social accounts"
  ON public.social_accounts FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = social_accounts.profile_id AND p.status = 'approved'));

CREATE TABLE public.social_snapshots (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  social_account_id uuid NOT NULL REFERENCES public.social_accounts(id) ON DELETE CASCADE,
  captured_at timestamp with time zone NOT NULL DEFAULT now(),
  followers bigint,
  following bigint,
  posts_count bigint,
  engagement_rate numeric,
  avg_likes numeric,
  avg_comments numeric,
  avg_views numeric,
  reach bigint,
  raw jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX social_snapshots_account_captured_idx
  ON public.social_snapshots (social_account_id, captured_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.social_snapshots TO authenticated;
GRANT SELECT ON public.social_snapshots TO anon;
GRANT ALL ON public.social_snapshots TO service_role;

ALTER TABLE public.social_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own social snapshots"
  ON public.social_snapshots FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_accounts sa
    JOIN public.profiles p ON p.id = sa.profile_id
    WHERE sa.id = social_snapshots.social_account_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.social_accounts sa
    JOIN public.profiles p ON p.id = sa.profile_id
    WHERE sa.id = social_snapshots.social_account_id AND p.user_id = auth.uid()));

CREATE POLICY "Admins can manage all social snapshots"
  ON public.social_snapshots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read approved social snapshots"
  ON public.social_snapshots FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM public.social_accounts sa
    JOIN public.profiles p ON p.id = sa.profile_id
    WHERE sa.id = social_snapshots.social_account_id AND p.status = 'approved'));

CREATE TRIGGER social_accounts_set_updated_at
  BEFORE UPDATE ON public.social_accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();