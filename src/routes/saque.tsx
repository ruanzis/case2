import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/skins";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

function detectKey(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "E-mail";
  if (/^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i.test(v)) return "Aleatória";
  const d = v.replace(/\D/g, "");
  if (/^\+/.test(v) || (d.length === 13 && d.startsWith("55"))) return "Telefone";
  if (d.length === 11 && /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/.test(v)) return "CPF";
  if (d.length === 11 || d.length === 10) return /^\(?\d{2}\)?\s?9/.test(v) ? "Telefone" : "CPF";
  return "Inválida";
}

function SaquePage() {
  const cart = useCart();
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState<{ key: string; type: string } | null>(null);
  const type = detectKey(key);

  const register = () => {
    if (!type || type === "Inválida") return toast.error("Chave Pix inválida");
    setSaved({ key: key.trim(), type });
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
        <Button className="w-full" onClick={register}>Cadastrar conta</Button>
      </div>

      {saved && (
        <div className="space-y-3 rounded-xl border border-border bg-card p-5">
          <p className="text-sm">Chave {saved.type}: <b>{saved.key}</b></p>
          <Button
            className="w-full"
            disabled={cart.balance <= 0}
            onClick={() => toast.success("Solicitação de saque enviada para análise. Entraremos em contato no privado.")}
          >
            Solicitar saque agora
          </Button>
        </div>
      )}
    </div>
  );
}
