-- "New matching offers" in the dashboard needs a per-search baseline, and the
-- same filter set should not be stored twice for one member.
ALTER TABLE public.saved_searches
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS saved_searches_unique_params
  ON public.saved_searches (user_id, md5(params::text));
