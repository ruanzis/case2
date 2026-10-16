CREATE TABLE public.steam_accounts (user_id uuid PRIMARY KEY, steam_id text NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT SELECT, DELETE ON public.steam_accounts TO authenticated;
GRANT ALL ON public.steam_accounts TO service_role;
ALTER TABLE public.steam_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own steam read" ON public.steam_accounts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Own steam delete" ON public.steam_accounts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TABLE public.steam_link_states (nonce text PRIMARY KEY, user_id uuid NOT NULL, created_at timestamptz NOT NULL DEFAULT now());
GRANT ALL ON public.steam_link_states TO service_role;
ALTER TABLE public.steam_link_states ENABLE ROW LEVEL SECURITY;