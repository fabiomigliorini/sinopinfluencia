UPDATE public.profiles SET niche = 'Lifestyle, Família' WHERE id = '213ab3cc-9cce-49a8-a600-c1ee2b136080';
UPDATE public.profiles SET niche = 'Marketing, Política, Negócios e empreendedorismo, Associativismo' WHERE id = 'ed41db63-4ec2-4876-be8e-c08432448a96';
UPDATE public.profiles SET niche = 'Agro' WHERE id = 'fed9064e-9973-4a24-808f-56706f1da64c';
UPDATE public.profiles SET niche = 'Esportes, Fitness, Gastronomia' WHERE id = '8edf29e2-a9ff-46e1-8abe-b0ed28047e22';
UPDATE public.profiles SET niche = 'Moda, Beleza' WHERE id = 'dce1ce93-d309-4901-aee3-8ba5337a21ee';
UPDATE public.profiles SET niche = 'Humor, Entretenimento' WHERE id = '3e88206e-e6ba-4d73-995a-eccbc47a3bc7';
UPDATE public.profiles SET niche = 'Esportes, Fitness' WHERE id = '98858d2d-8424-4c78-85e8-f136db28ac70';
UPDATE public.profiles SET niche = trim(both ', ' from regexp_replace(niche, '\s*Teste de Nicho Novo\s*,?', '', 'gi')) WHERE niche ILIKE '%Teste de Nicho Novo%';
UPDATE public.profiles SET bio = left(bio, 500) WHERE bio IS NOT NULL AND length(bio) > 500;