CREATE TABLE public.favorites (
  user_id text NOT NULL,
  offer_id text NOT NULL CHECK (char_length(offer_id) BETWEEN 1 AND 24),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, offer_id)
);
CREATE TABLE public.saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  label text NOT NULL CHECK (char_length(label) BETWEEN 1 AND 80),
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX saved_searches_user_idx ON public.saved_searches (user_id);
GRANT ALL ON public.favorites TO service_role;
GRANT ALL ON public.saved_searches TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_searches ENABLE ROW LEVEL SECURITY;