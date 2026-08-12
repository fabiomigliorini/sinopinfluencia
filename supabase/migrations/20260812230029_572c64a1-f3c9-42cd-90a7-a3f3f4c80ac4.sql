
INSERT INTO auth.users (id, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'bia.demo@sinopinfluencia.local', now(), '{"full_name":"Bia Duarte"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'rafa.demo@sinopinfluencia.local', now(), '{"full_name":"Rafa Nogueira"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'lele.demo@sinopinfluencia.local', now(), '{"full_name":"Lelê Martins"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'diego.demo@sinopinfluencia.local', now(), '{"full_name":"Diego Kramer"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000005', 'ana.demo@sinopinfluencia.local', now(), '{"full_name":"Ana Bittencourt"}'::jsonb, now(), now()),
  ('00000000-0000-0000-0000-000000000006', 'theo.demo@sinopinfluencia.local', now(), '{"full_name":"Théo Ramalho"}'::jsonb, now(), now());

UPDATE public.profiles SET
    slug = 'bia-duarte',
    full_name = 'Bia Duarte',
    display_name = 'Bia Duarte',
    niche = 'Gastronomia',
    tier = 'featured',
    city = 'Sinop, MT',
    bio = 'Roteiros de comida de rua e restaurantes de Sinop, com resenhas rápidas e sinceras.',
    main_network = 'instagram'::public.social_network,
    status = 'approved',
    whatsapp = '5566999990001',
    submitted_at = now(),
    approved_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000001';

UPDATE public.profiles SET
    slug = 'rafa-nogueira',
    full_name = 'Rafa Nogueira',
    display_name = 'Rafa Nogueira',
    niche = 'Humor & Entretenimento',
    tier = 'reference',
    city = 'Sinop, MT',
    bio = 'Comédia e cobertura de eventos com um jeito único de contar a cidade.',
    main_network = 'tiktok'::public.social_network,
    status = 'approved',
    whatsapp = '5566999990002',
    submitted_at = now(),
    approved_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000002';

UPDATE public.profiles SET
    slug = 'lele-martins',
    full_name = 'Lelê Martins',
    display_name = 'Lelê Martins',
    niche = 'Moda & Beleza',
    tier = 'creator',
    city = 'Sinop, MT',
    bio = 'Provadores, dicas de styling e giro pelas lojas do centro de Sinop.',
    main_network = 'instagram'::public.social_network,
    status = 'approved',
    whatsapp = '5566999990003',
    submitted_at = now(),
    approved_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000003';

UPDATE public.profiles SET
    slug = 'diego-kramer',
    full_name = 'Diego Kramer',
    display_name = 'Diego Kramer',
    niche = 'Agro & Cotidiano Rural',
    tier = 'icon',
    city = 'Sinop, MT',
    bio = 'Mostro o dia a dia do agro de Mato Grosso com humor e proximidade — da lavoura ao balcão da loja. Especialista em levar o público da cidade a conhecer (e comprar de) revendas, lojas agropecuárias e comércio ligado ao campo.',
    main_network = 'tiktok'::public.social_network,
    status = 'approved',
    whatsapp = '5566999990004',
    submitted_at = now(),
    approved_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000004';

UPDATE public.profiles SET
    slug = 'ana-bittencourt',
    full_name = 'Ana Bittencourt',
    display_name = 'Ana Bittencourt',
    niche = 'Lifestyle & Família',
    tier = 'featured',
    city = 'Sinop, MT',
    bio = 'Rotina de mãe em Sinop indicando o que há de bom no comércio local.',
    main_network = 'instagram'::public.social_network,
    status = 'approved',
    whatsapp = '5566999990005',
    submitted_at = now(),
    approved_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000005';

UPDATE public.profiles SET
    slug = 'theo-ramalho',
    full_name = 'Théo Ramalho',
    display_name = 'Théo Ramalho',
    niche = 'Esporte & Fitness',
    tier = 'creator',
    city = 'Sinop, MT',
    bio = 'Treinos, academias e lojas esportivas parceiras da cidade.',
    main_network = 'instagram'::public.social_network,
    status = 'approved',
    whatsapp = '5566999990006',
    submitted_at = now(),
    approved_at = now()
WHERE user_id = '00000000-0000-0000-0000-000000000006';

INSERT INTO public.profile_metrics (profile_id, network, followers, audience_pct)
SELECT id, 'instagram'::public.social_network, '38K', 78 FROM public.profiles WHERE slug = 'bia-duarte'
UNION ALL
SELECT id, 'tiktok'::public.social_network, '12K', 82 FROM public.profiles WHERE slug = 'bia-duarte'
UNION ALL
SELECT id, 'instagram'::public.social_network, '94K', 65 FROM public.profiles WHERE slug = 'rafa-nogueira'
UNION ALL
SELECT id, 'tiktok'::public.social_network, '210K', 71 FROM public.profiles WHERE slug = 'rafa-nogueira'
UNION ALL
SELECT id, 'instagram'::public.social_network, '6K', 88 FROM public.profiles WHERE slug = 'lele-martins'
UNION ALL
SELECT id, 'instagram'::public.social_network, '82K', 68 FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL
SELECT id, 'tiktok'::public.social_network, '146K', 72 FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL
SELECT id, 'youtube'::public.social_network, '31K', 65 FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL
SELECT id, 'instagram'::public.social_network, '27K', 81 FROM public.profiles WHERE slug = 'ana-bittencourt'
UNION ALL
SELECT id, 'tiktok'::public.social_network, '9K', 85 FROM public.profiles WHERE slug = 'ana-bittencourt'
UNION ALL
SELECT id, 'instagram'::public.social_network, '4.5K', 92 FROM public.profiles WHERE slug = 'theo-ramalho'
UNION ALL
SELECT id, 'tiktok'::public.social_network, '3K', 94 FROM public.profiles WHERE slug = 'theo-ramalho';

INSERT INTO public.profile_formats (profile_id, format)
SELECT id, 'Reels / TikTok' FROM public.profiles WHERE slug = 'bia-duarte'
UNION ALL SELECT id, 'Cobertura de eventos' FROM public.profiles WHERE slug = 'bia-duarte'
UNION ALL SELECT id, 'Stories patrocinados' FROM public.profiles WHERE slug = 'bia-duarte'
UNION ALL SELECT id, 'Vídeo longo' FROM public.profiles WHERE slug = 'rafa-nogueira'
UNION ALL SELECT id, 'Cobertura de eventos' FROM public.profiles WHERE slug = 'rafa-nogueira'
UNION ALL SELECT id, 'Humor' FROM public.profiles WHERE slug = 'rafa-nogueira'
UNION ALL SELECT id, 'Stories' FROM public.profiles WHERE slug = 'lele-martins'
UNION ALL SELECT id, 'Provadores' FROM public.profiles WHERE slug = 'lele-martins'
UNION ALL SELECT id, 'Dicas de styling' FROM public.profiles WHERE slug = 'lele-martins'
UNION ALL SELECT id, 'Reels / TikTok' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'Cobertura de eventos' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'Vídeo longo' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'UGC para a marca' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'Podcast' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'Carrossel' FROM public.profiles WHERE slug = 'ana-bittencourt'
UNION ALL SELECT id, 'Vídeo' FROM public.profiles WHERE slug = 'ana-bittencourt'
UNION ALL SELECT id, 'Reels' FROM public.profiles WHERE slug = 'ana-bittencourt'
UNION ALL SELECT id, 'Reels' FROM public.profiles WHERE slug = 'theo-ramalho'
UNION ALL SELECT id, 'Stories' FROM public.profiles WHERE slug = 'theo-ramalho'
UNION ALL SELECT id, 'Vídeos de treino' FROM public.profiles WHERE slug = 'theo-ramalho';

INSERT INTO public.profile_works (profile_id, title, description, sort_order)
SELECT id, 'Reel · Loja Agropecuária', 'Campanha de divulgação de produtos agropecuários', 0 FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL
SELECT id, 'Cobertura · Feira do Agro', 'Cobertura completa da feira agropecuária regional', 1 FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL
SELECT id, 'Vídeo · Revenda de Máquinas', 'Tour pela revenda de máquinas agrícolas', 2 FROM public.profiles WHERE slug = 'diego-kramer';

INSERT INTO public.profile_brands (profile_id, brand_name)
SELECT id, 'Agropecuária Vale Verde' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'Rural Center' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'Casa do Produtor' FROM public.profiles WHERE slug = 'diego-kramer'
UNION ALL SELECT id, 'Feira Agrotec' FROM public.profiles WHERE slug = 'diego-kramer';
