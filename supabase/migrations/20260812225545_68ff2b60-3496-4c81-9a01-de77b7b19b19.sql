
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.app_role AS ENUM ('admin');
CREATE TYPE public.tier AS ENUM ('creator', 'featured', 'reference', 'icon');
CREATE TYPE public.profile_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
CREATE TYPE public.social_network AS ENUM ('instagram', 'tiktok', 'youtube', 'facebook', 'twitter', 'kwai');

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role public.app_role NOT NULL,
    UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.profiles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    slug text UNIQUE NOT NULL,
    full_name text,
    display_name text NOT NULL,
    niche text,
    tier public.tier NOT NULL DEFAULT 'creator',
    city text DEFAULT 'Sinop, MT',
    bio text,
    main_network public.social_network,
    status public.profile_status NOT NULL DEFAULT 'draft',
    avatar_url text,
    whatsapp text,
    email text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    submitted_at timestamptz,
    approved_at timestamptz,
    approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT ON public.profiles TO anon;

CREATE TABLE public.profile_metrics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    network public.social_network NOT NULL,
    followers text,
    audience_pct decimal(5,2),
    UNIQUE (profile_id, network)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_metrics TO authenticated;
GRANT ALL ON public.profile_metrics TO service_role;
GRANT SELECT ON public.profile_metrics TO anon;

CREATE TABLE public.profile_formats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    format text NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_formats TO authenticated;
GRANT ALL ON public.profile_formats TO service_role;
GRANT SELECT ON public.profile_formats TO anon;

CREATE TABLE public.profile_works (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    sort_order integer NOT NULL DEFAULT 0
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_works TO authenticated;
GRANT ALL ON public.profile_works TO service_role;
GRANT SELECT ON public.profile_works TO anon;

CREATE TABLE public.profile_brands (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    brand_name text NOT NULL
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_brands TO authenticated;
GRANT ALL ON public.profile_brands TO service_role;
GRANT SELECT ON public.profile_brands TO anon;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (user_id, slug, display_name, email, status)
    VALUES (
        NEW.id,
        'perfil-' || substr(NEW.id::text, 1, 8),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Novo usuário'),
        NEW.email,
        'draft'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read approved profiles" ON public.profiles FOR SELECT TO anon, authenticated USING (status = 'approved');
CREATE POLICY "Users can read own profiles" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profile_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read approved profile metrics" ON public.profile_metrics FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_metrics.profile_id AND status = 'approved'));
CREATE POLICY "Users can manage own profile metrics" ON public.profile_metrics FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_metrics.profile_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Admins can manage all profile metrics" ON public.profile_metrics FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profile_formats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read approved profile formats" ON public.profile_formats FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_formats.profile_id AND status = 'approved'));
CREATE POLICY "Users can manage own profile formats" ON public.profile_formats FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_formats.profile_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Admins can manage all profile formats" ON public.profile_formats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profile_works ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read approved profile works" ON public.profile_works FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_works.profile_id AND status = 'approved'));
CREATE POLICY "Users can manage own profile works" ON public.profile_works FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_works.profile_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Admins can manage all profile works" ON public.profile_works FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.profile_brands ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can read approved profile brands" ON public.profile_brands FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_brands.profile_id AND status = 'approved'));
CREATE POLICY "Users can manage own profile brands" ON public.profile_brands FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = profile_brands.profile_id AND profiles.user_id = auth.uid()));
CREATE POLICY "Admins can manage all profile brands" ON public.profile_brands FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
