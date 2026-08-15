-- Followers now live only in social_snapshots, like posts/likes/views.
-- Backfill any declared number that has no snapshot value yet.
INSERT INTO public.social_snapshots (social_account_id, followers)
SELECT sa.id, NULLIF(regexp_replace(sa.declared_followers, '[^0-9]', '', 'g'), '')::bigint
FROM public.social_accounts sa
WHERE sa.is_declared = true
  AND sa.declared_followers IS NOT NULL
  AND NULLIF(regexp_replace(sa.declared_followers, '[^0-9]', '', 'g'), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.social_snapshots ss
    WHERE ss.social_account_id = sa.id AND ss.followers IS NOT NULL
  );

ALTER TABLE public.social_accounts DROP COLUMN declared_followers;