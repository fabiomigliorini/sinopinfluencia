ALTER TYPE public.social_network ADD VALUE IF NOT EXISTS 'linkedin';

CREATE POLICY "Users can upload own profile images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own profile images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own profile images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own profile images"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'profile-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Admins can manage profile images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'profile-images' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'profile-images' AND public.has_role(auth.uid(), 'admin'));