CREATE TABLE public.purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  skin_id text NOT NULL,
  name text NOT NULL,
  price numeric(12,2) NOT NULL,
  method text NOT NULL,
  reference text,
  state text NOT NULL DEFAULT 'owned',
  sale_value numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX purchases_user_idx ON public.purchases(user_id, created_at DESC);
CREATE TABLE public.pix_payments (
  reference text PRIMARY KEY,
  user_id uuid NOT NULL,
  skin_ids text[] NOT NULL,
  amount numeric(12,2) NOT NULL,
  claimed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.purchases TO authenticated;
GRANT ALL ON public.purchases TO service_role;
GRANT ALL ON public.pix_payments TO service_role;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own purchases" ON public.purchases FOR SELECT TO authenticated USING (auth.uid() = user_id);