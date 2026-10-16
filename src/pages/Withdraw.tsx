import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function Withdraw() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'email' | 'phone' | 'random'>('cpf');
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const load = async () => {
    if (!user) return;
    const [{ data: bal }, { data: wh }] = await Promise.all([
      supabase.from('users').select('balance, withdrawable').eq('id', user.id).single(),
      supabase.from('withdrawals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ]);
    setBalance(bal?.withdrawable ?? bal?.balance ?? 0);
    setHistory(wh ?? []);
  };

  useEffect(() => {
    load();
  }, [user]);

  const min = 20;
  const feePct = 5; // taxa do site (5%)
  const net = amount ? Number(amount) * (1 - feePct / 100) : 0;

  const submit = async () => {
    if (!user) return;
    const value = Number(amount);
    if (!value || value < min) {
      setMsg({ type: 'err', text: `Valor mínimo de saque: R$ ${min}` });
      return;
    }
    if (value > balance) {
      setMsg({ type: 'err', text: 'Saldo insuficiente' });
      return;
    }
    if (!pixKey) {
      setMsg({ type: 'err', text: 'Informe sua chave PIX' });
      return;
    }

    setLoading(true);
    setMsg(null);
    const resp = await fetch('/api/withdraw', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, amount: value, pixKey, pixKeyType }),
    });
    const data = await resp.json();
    setLoading(false);

    if (data.error) {
      setMsg({ type: 'err', text: data.error });
      return;
    }
    setMsg({ type: 'ok', text: 'Saque solicitado! Processamos em até 24h úteis.' });
    setAmount('');
    load();
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Solicitar Saque</h1>

      <div className="rounded-xl bg-card border p-6">
        <p className="text-sm text-muted-foreground">Saldo disponível</p>
        <p className="text-3xl font-bold">R\$ {balance.toFixed(2)}</p>
        <p className="text-xs text-muted-foreground">Taxa de {feePct}% · Saque mínimo R\$ {min}</p>
      </div>

      <div className="rounded-xl bg-card border p-6 space-y-4">
        <div>
          <label className="text-sm">Valor do saque</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full input"
          />
          {amount && (
            <p className="text-xs text-muted-foreground mt-1">
              Você receberá R\$ {net.toFixed(2)}
            </p>
          )}
        </div>

        <div>
          <label className="text-sm">Tipo de chave PIX</label>
          <select
            value={pixKeyType}
            onChange={e => setPixKeyType(e.target.value as any)}
            className="w-full input"
          >
            <option value="cpf">CPF</option>
            <option value="email">E-mail</option>
            <option value="phone">Celular</option>
            <option value="random">Chave aleatória</option>
          </select>
        </div>

        <div>
          <label className="text-sm">Chave PIX</label>
          <input
            value={pixKey}
            onChange={e => setPixKey(e.target.value)}
            placeholder={
              pixKeyType === 'cpf'
                ? '000.000.000-00'
                : pixKeyType === 'email'
                ? 'email@exemplo.com'
                : 'Chave PIX'
            }
            className="w-full input"
          />
        </div>

        <button onClick={submit} disabled={loading} className="w-full btn btn-primary">
          {loading ? 'Processando...' : 'Solicitar saque'}
        </button>
        {msg && (
          <p className={`text-sm ${msg.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
            {msg.text}
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Histórico de saques</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum saque ainda.</p>
        ) : (
          <ul className="space-y-2">
            {history.map(h => (
              <li key={h.id} className="flex justify-between rounded-lg border p-3 text-sm">
                <div>
                  <p className="font-medium">R\$ {h.net_amount?.toFixed(2) ?? h.amount.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(h.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <span
                  className={`badge ${
                    h.status === 'paid'
                      ? 'badge-green'
                      : h.status === 'pending'
                      ? 'badge-yellow'
                      : 'badge-red'
                  }`}
                >
                  {h.status === 'paid' ? 'Pago' : h.status === 'pending' ? 'Pendente' : 'Recusado'}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
