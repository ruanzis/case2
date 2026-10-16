import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import SteamAPI from 'steamapi';
import { generatePix, verifyPixSignature } from './src/lib/pix';
import { verifySteamTicket } from './src/lib/steam';

const app = express();
app.use(cors());
app.use(express.json());

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const steam = new SteamAPI(process.env.STEAM_API_KEY!);

// ==========================================================
// 1. ROTAS DE SAQUE (VENDEDOR)
// ==========================================================
app.get('/api/balance/:userId', async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from('users')
    .select('balance, withdrawable')
    .eq('id', userId)
    .single();
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.post('/api/withdraw', async (req, res) => {
  const { userId, amount, pixKey, pixKeyType } = req.body;

  const { data: user, error: uErr } = await supabase
    .from('users')
    .select('balance')
    .eq('id', userId)
    .single();
  if (uErr || !user) return res.status(404).json({ error: 'Usuário não encontrado' });
  if (amount > user.balance) return res.status(400).json({ error: 'Saldo insuficiente' });

  const fee = process.env.WITHDRAWAL_FEE_PERCENT
    ? amount * (Number(process.env.WITHDRAWAL_FEE_PERCENT) / 100)
    : 0;
  const netAmount = amount - fee;

  const { data: withdrawal, error } = await supabase
    .from('withdrawals')
    .insert({
      user_id: userId,
      amount,
      net_amount: netAmount,
      pix_key: pixKey,
      pix_key_type: pixKeyType,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error });

  // Deduz do saldo
  await supabase
    .from('users')
    .update({ balance: user.balance - amount })
    .eq('id', userId);

  // Dispara pagamento PIX automático
  const payout = await sendPixPayout(pixKey, pixKeyType, netAmount, withdrawal.id);
  if (payout?.success) {
    await supabase
      .from('withdrawals')
      .update({ status: 'paid', paid_at: new Date() })
      .eq('id', withdrawal.id);
  }

  res.json({ withdrawal });
});

app.get('/api/withdrawals/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('withdrawals')
    .select('*')
    .eq('user_id', req.params.userId)
    .order('created_at', { ascending: false });
  if (error) return res.status(500).json({ error });
  res.json(data);
});

// ==========================================================
// 2. ROTAS DE ASSINATURA PREMIUM
// ==========================================================
app.get('/api/plans', async (_req, res) => {
  const { data, error } = await supabase.from('plans').select('*');
  if (error) return res.status(500).json({ error });
  res.json(data);
});

app.get('/api/subscription/:userId', async (req, res) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', req.params.userId)
    .eq('status', 'active')
    .order('ends_at', { ascending: false })
    .limit(1);
  if (error) return res.status(500).json({ error });
  res.json(data?.[0] ?? null);
});

app.post('/api/subscribe', async (req, res) => {
  const { userId, planId } = req.body;
  const { data: plan } = await supabase
    .from('plans')
    .select('*')
    .eq('id', planId)
    .single();
  if (!plan) return res.status(404).json({ error: 'Plano não encontrado' });

  const pix = await generatePix(plan.price, `Assinatura ${plan.name}`, {
    userId,
    planId,
    type: 'subscription',
  });

  const { data: sub, error } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      plan_id: planId,
      price: plan.price,
      status: 'pending',
      pix_code: pix.code,
      pix_qr: pix.qr,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error });
  res.json({ subscription: sub, pix });
});

app.post('/api/subscribe/webhook', async (req, res) => {
  const event = req.body;
  const { subscriptionId, paid } = event;
  if (!paid) return res.sendStatus(200);

  const { data: sub } = await supabase
    .from('subscriptions')
    .update({ status: 'active', activated_at: new Date() })
    .eq('id', subscriptionId)
    .select()
    .single();

  if (sub) {
    const { data: plan } = await supabase
      .from('plans')
      .select('duration_days')
      .eq('id', sub.plan_id)
      .single();
    await supabase
      .from('subscriptions')
      .update({ ends_at: addDays(new Date(), plan?.duration_days ?? 30) })
      .eq('id', subscriptionId);
    await supabase
      .from('users')
      .update({ is_premium: true })
      .eq('id', sub.user_id);
  }
  res.sendStatus(200);
});

// ==========================================================
// 3. ROTAS DE CHECKOUT (COMPRA DE SKIN)
// ==========================================================
app.get('/api/skins', async (_req, res) => {
  const { data, error } = await supabase
    .from('skins')
    .select('*')
    .eq('status', 'available')
    .order('price', { ascending: true });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/api/checkout', async (req, res) => {
  const { skinId, userId } = req.body;
  const { data: skin } = await supabase
    .from('skins')
    .select('*')
    .eq('id', skinId)
    .single();

  if (!skin) return res.status(404).json({ error: 'Skin não encontrada' });
  if (skin.status !== 'available') return res.status(400).json({ error: 'Skin já vendida' });

  await supabase.from('skins').update({ status: 'reserved' }).eq('id', skinId);
  const pix = await generatePix(skin.price, `Compra skin ${skin.name}`, {
    userId,
    skinId,
  });

  const { data: purchase, error } = await supabase
    .from('purchases')
    .insert({
      user_id: userId,
      skin_id: skinId,
      amount: skin.price,
      pix_code: pix.code,
      pix_qr: pix.qr,
      status: 'pending',
    })
    .select()
    .single();

  if (error) return res.status(500).json({ error });
  res.json({ purchase, pix });
});

app.post('/api/pix/webhook', async (req, res) => {
  const event = req.body;
  if (!verifyPixSignature(req)) return res.sendStatus(401);

  const { purchaseId, paid } = event;
  if (!paid) return res.sendStatus(200);

  const { data: purchase } = await supabase
    .from('purchases')
    .update({ status: 'paid', paid_at: new Date() })
    .eq('id', purchaseId)
    .select()
    .single();

  if (purchase) {
    await supabase.from('skins').update({ status: 'sold' }).eq('id', purchase.skin_id);
    await deliverSkinToSteam(purchase);
  }
  res.sendStatus(200);
});

// ==========================================================
// 4. ROTAS DE INTEGRAÇÃO STEAM
// ==========================================================
app.post('/api/steam/verify', async (req, res) => {
  const { ticket } = req.body;
  try {
    const steamUser = await verifySteamTicket(ticket);
    const { data: account } = await supabase
      .from('steam_accounts')
      .select('*')
      .eq('steam_id', steamUser.steamId)
      .single();

    res.json({ user: steamUser, account });
  } catch (e) {
    res.status(401).json({ error: 'Ticket Steam inválido' });
  }
});

app.post('/api/steam/account', async (req, res) => {
  const { userId, steamId, tradeUrl } = req.body;
  const { data, error } = await supabase
    .from('steam_accounts')
    .upsert({
      user_id: userId,
      steam_id: steamId,
      trade_url: tradeUrl,
    })
    .select()
    .single();
  res.json(error ? { error } : data);
});

// ==========================================================
// FUNÇÕES AUXILIARES E INICIALIZAÇÃO
// ==========================================================
function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

async function deliverSkinToSteam(purchase: any) {
  const { data: acct } = await supabase
    .from('steam_accounts')
    .select('trade_url')
    .eq('user_id', purchase.user_id)
    .single();
  if (acct?.trade_url) {
    await (steam as any).createOffer(acct.trade_url, [{ id: purchase.skin_id }]);
  }
}

async function sendPixPayout(key: string, type: string, amount: number, withdrawalId: string) {
  const data = await fetch(`${process.env.PIX_API_URL}/transfers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PIX_API_TOKEN}`,
    },
    body: JSON.stringify({ key, type, amount, withdrawalId }),
  }).then(r => r.json());
  return { success: !!data };
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
