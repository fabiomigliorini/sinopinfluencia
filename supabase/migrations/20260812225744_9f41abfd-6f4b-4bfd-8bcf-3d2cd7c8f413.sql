
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
        'perfil-' || substr(NEW.id::text, 25, 8),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email, 'Novo usuário'),
        NEW.email,
        'draft'
    );
    RETURN NEW;
END;
$$;
