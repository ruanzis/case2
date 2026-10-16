import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export default function Premium() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<any[]>([]);
  const [mySub, setMySub] = useState<any>(null);
  const [pix, setPix] = useState<any>(null);

  const load = async () => {
    const { data: p } = await supabase.from('plans').select('*').order('price');
    setPlans(p ?? []);
    if (user) {
      const { data: s } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('ends_at', { ascending: false })
        .limit(1);
      setMySub(s?.[0] ?? null);
    }
  };

  useEffect(() => {
    load();
  }, [user]);

  const buy = async (plan: any) => {
    if (!user) return;
    const resp = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, planId: plan.id }),
    });
    const data = await resp.json();
    setPix(data.pix);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Premium</h1>
      {mySub && mySub.status === 'active' && (
        <div className="rounded-xl border bg-green-500/10 p-4">
          <p className="font-semibold text-green-600">
            ✓ Você é Premium até {new Date(mySub.ends_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        {plans.map(plan => (
          <div key={plan.id} className="rounded-xl border p-6 flex flex-col gap-3">
            <h3 className="text-lg font-bold">{plan.name}</h3>
            <p className="text-3xl font-black">R$ {plan.price.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">{plan.description}</p>
            <ul className="text-sm space-y-1">
              {(plan.benefits ?? []).map((b: string) => (
                <li key={b}>• {b}</li>
              ))}
            </ul>
            <button onClick={() => buy(plan)} className="btn btn-primary mt-auto">
              Assinar {mySub?.plan_id === plan.id ? '(atual)' : ''}
            </button>
          </div>
        ))}
      </div>

      {pix && (
        <div className="rounded-xl border p-6 text-center space-y-3">
          <p className="text-sm">Pague o PIX abaixo para ativar:</p>
          <img src={pix.qr} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
          <p className="text-xs break-all text-muted-foreground">{pix.code}</p>
        </div>
      )}
    </div>
  );
}
