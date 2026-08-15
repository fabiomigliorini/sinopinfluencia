UPDATE public.social_accounts
SET display_name = NULLIF(TRIM(SPLIT_PART(display_name, '"', 1)), '')
WHERE display_name LIKE '%"%';