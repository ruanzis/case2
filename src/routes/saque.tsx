import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/skins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useServerFn } from "@tanstack/react-start";
import { requestWithdrawal } from "@/lib/withdraw.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/saque")({
  head: () => ({
    meta: [
      { title: "Saque — csgomoney" },
      { name: "description", content: "Veja seu Saldo CSGO e solicite saque via Pix." },
      { property: "og:title", content: "Saque — csgomoney" },
      { property: "og:description", content: "Cadastre sua chave Pix e solicite o saque do seu saldo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SaquePage,
});

function validCpf(d: string): boolean {
  if (d.length !== 11 || /^(\d)\1+$/.test(d)) return false;
  for (const n of [9, 10]) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += Number(d[i]) * (n + 1 - i);
    const dv = ((sum * 10) % 11) % 10;
    if (dv !== Number(d[n])) return false;
  }
  return true;
}

const DDDS = new Set("11 12 13 14 15 16 17 18 19 21 22 24 27 28 31 32 33 34 35 37 38 41 42 43 44 45 46 47 48 49 51 53 54 55 61 62 63 64 65 66 67 68 69 71 73 74 75 77 79 81 82 83 84 85 86 87 88 89 91 92 93 94 95 96 97 98 99".split(" "));

function detectKey(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "E-mail";
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(v)) return "Aleatória";
  if (/[a-z]/i.test(v)) return "Inválida";
  let d = v.replace(/\D/g, "");
  const hasPlus = v.startsWith("+");
  if (hasPlus || d.length >= 12) {
    if (d.startsWith("55") && (d.length === 12 || d.length === 13) && DDDS.has(d.slice(2, 4))) return "Telefone";
    return "Inválida";
  }
  if (d.length === 11) {
    const formattedCpf = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/.test(v);
    const phoneOk = DDDS.has(d.slice(0, 2)) && d[2] === "9";
    const cpfOk = validCpf(d);
    if (formattedCpf) return cpfOk ? "CPF" : "Inválida";
    if (/^\(/.test(v) || /\s/.test(v)) return phoneOk ? "Telefone" : "Inválida";
    if (cpfOk && !phoneOk) return "CPF";
    if (phoneOk) return "Telefone";
    return cpfOk ? "CPF" : "Inválida";
  }
  if (d.length === 10 && DDDS.has(d.slice(0, 2))) return "Telefone";
  return "Inválida";
}

const STORE = "csgomoney-pix-account";

function SaquePage() {
  const cart = useCart();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState<{ key: string; type: string } | null>(null);
  const type = detectKey(key);
  const send = useServerFn(requestWithdrawal);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE);
      if (raw) setSaved(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const [removing, setRemoving] = useState(false);
  const [pwd, setPwd] = useState("");
  const [checking, setChecking] = useState(false);

  const removeAccount = async () => {
    const email = cart.user?.email;
    if (!email) { toast.error("Entre na sua conta primeiro"); return; }
    setChecking(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password: pwd });
    setChecking(false);
    if (error) { toast.error("Senha incorreta"); return; }
    localStorage.removeItem(STORE);
    setSaved(null); setKey(""); setPwd(""); setRemoving(false);
    toast.success("Conta Pix removida");
  };

  const register = () => {
    if (saved) { toast.error("Já existe uma conta Pix cadastrada. Remova-a para cadastrar outra."); return; }
    if (!type || type === "Inválida") { toast.error("Chave Pix inválida"); return; }
    const acc = { key: key.trim(), type };
    setSaved(acc);
    try { localStorage.setItem(STORE, JSON.stringify(acc)); } catch { /* ignore */ }
    toast.success("Conta Pix cadastrada");
  };

  return (
    <div className="mx-auto max-w-xl space-y-4 p-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm text-muted-foreground">Saldo CSGO</p>
        <p className="text-3xl font-bold text-primary">{brl(cart.balance)}</p>
        <p className="mt-1 text-xs text-muted-foreground">Valor das skins vendidas na Venda instantânea.</p>
      </div>

      <div className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold">Cadastrar conta Pix</h2>
        <div>
          <label className="text-xs text-muted-foreground">País</label>
          <Input value="Brasil" disabled />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">Chave Pix (CPF, telefone, e-mail ou aleatória)</label>
          <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="Digite sua chave Pix" />
          {type && <p className="mt-1 text-xs text-muted-foreground">Tipo detectado: <b>{type}</b></p>}
        </div>
        <Button className="w-full" onClick={register} disabled={!!saved}>{saved ? "Conta já cadastrada" : "Cadastrar conta"}</Button>
      </div>

      {saved && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm">Chave {saved.type}: <b>{saved.key}</b></p>
            <span className="rounded-full bg-success/20 px-2 py-0.5 text-xs font-semibold text-success">✓ Conta cadastrada</span>
          </div>
          {!removing ? (
            <button className="text-xs text-muted-foreground underline" onClick={() => setRemoving(true)}>Remover conta</button>
          ) : (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Digite a senha da sua conta do site para remover a chave Pix.</p>
              <Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="Senha da conta" />
              <div className="flex gap-2">
                <Button size="sm" variant="destructive" disabled={checking || !pwd} onClick={removeAccount}>{checking ? "Verificando..." : "Confirmar remoção"}</Button>
                <Button size="sm" variant="ghost" onClick={() => { setRemoving(false); setPwd(""); }}>Cancelar</Button>
              </div>
            </div>
          )}
          <Button
            className="w-full"
            disabled={cart.balance <= 0 || sending}
            onClick={async () => {
              setSending(true);
              try {
                await send({ data: { pixKey: saved.key, pixType: saved.type as "CPF" } });
                toast.success("Solicitação de saque enviada para análise. Entraremos em contato no privado.");
              } catch (e) { toast.error(e instanceof Error ? e.message : "Erro"); }
              finally { setSending(false); }
            }}
          >
            Solicitar saque agora
          </Button>
        </div>
      )}
    </div>
  );
}
