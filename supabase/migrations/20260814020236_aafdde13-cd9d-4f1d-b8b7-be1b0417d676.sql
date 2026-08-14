ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS review_pending boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET status = 'approved', review_pending = true
WHERE status = 'pending' AND approved_at IS NOT NULL;