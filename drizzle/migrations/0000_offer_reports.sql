CREATE TABLE public.offer_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id text NOT NULL CHECK (char_length(offer_id) BETWEEN 1 AND 24),
  seller_id text CHECK (seller_id IS NULL OR char_length(seller_id) <= 40),
  seller_name text CHECK (seller_name IS NULL OR char_length(seller_name) <= 80),
  reason text NOT NULL CHECK (reason IN ('scam','fake','impersonation','spam','other')),
  details text NOT NULL DEFAULT '' CHECK (char_length(details) <= 1000),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.offer_reports TO anon, authenticated;
GRANT SELECT ON public.offer_reports TO anon, authenticated;
GRANT ALL ON public.offer_reports TO service_role;
ALTER TABLE public.offer_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a pending report" ON public.offer_reports FOR INSERT TO anon, authenticated WITH CHECK (status = 'pending');
CREATE POLICY "Confirmed reports are public" ON public.offer_reports FOR SELECT TO anon, authenticated USING (status = 'confirmed');