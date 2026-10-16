CREATE TABLE public.pix_accounts (
  user_id uuid PRIMARY KEY,
  pix_key text NOT NULL,
  pix_type text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pix_accounts TO authenticated;
GRANT ALL ON public.pix_accounts TO service_role;
ALTER TABLE public.pix_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pix account" ON public.pix_accounts
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);