import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { Check, Crown, Loader2 } from "lucide-react";
import { createSubscriptionPix, checkSubscriptionPix } from "@/lib/subscription.functions";
import { useSubscription } from "@/lib/use-subscription";

export const Route = createFileRoute("/assinatura")({
  head: () => ({
    meta: [
      { title: "Premium — csgomoney" },
      { name: "description", content: "Seja Premium por R$ 41,40: negocie skins quando quiser e veja skins em tempo real antes do lançamento." },
      { property: "og:title", content: "Premium — csgomoney" },
      { property: "og:description", content: "Negocie quando quiser e veja skins antes do lançamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Assinatura,
});

function Assinatura() {
  const { active, refresh } = useSubscription();
  const create = useServerFn(createSubscriptionPix);
  const check = useServerFn(checkSubscriptionPix);
  const [pix, setPix] = useState<{ pixCode: string; reference: string } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!pix || active) return;
    const t = setInterval(async () => {
      const r = await check({ data: { reference: pix.reference } }).catch(() => null);
      if (r?.paid) { toast.success("Pagamento confirmado! Acesso liberado."); setPix(null); await refresh(); }
    }, 5000);
    return () => clearInterval(t);
  }, [pix, active, check, refresh]);

  async function start() {
    setLoading(true);
    try {
      const r = await create();
      if ("error" in r) toast.error(r.error); else setPix(r);
    } finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 rounded-xl bg-surface p-6">
      <h1 className="flex items-center gap-2 font-display text-2xl font-bold"><Crown className="h-6 w-6 text-accent" /> Premium csgomoney</h1>
      <p className="text-3xl font-bold">R$ 41,40 <span className="text-sm font-normal text-muted-foreground">pagamento único via Pix</span></p>
      <div className="space-y-2 text-sm">
        <p className="font-medium">O que você recebe:</p>
        <p className="flex gap-2"><Check className="h-4 w-4 text-success" /> Negocie skins quando quiser.</p>
        <p className="flex gap-2"><Check className="h-4 w-4 text-success" /> Veja skins em tempo real antes do lançamento.</p>
        <p className="flex gap-2"><Check className="h-4 w-4 text-success" /> O acesso fica ligado à sua conta, em qualquer aparelho.</p>
      </div>
      <p className="rounded-md bg-secondary p-3 text-xs text-muted-foreground">
        Esta assinatura Premium libera os benefícios acima. Ela não tem relação com saque, não libera saldo e não é exigida para sacar.
      </p>

      {active ? (
        <div className="space-y-3 text-center">
          <p className="font-semibold text-success">Premium ativo ✓</p>
          <Link to="/" className="inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Ir ao Market</Link>
        </div>
      ) : pix ? (
        <div className="space-y-3 text-center">
          <div className="mx-auto w-fit rounded bg-foreground p-3"><QRCodeSVG value={pix.pixCode} size={180} /></div>
          <button onClick={() => { void navigator.clipboard.writeText(pix.pixCode); toast.success("Código copiado"); }} className="w-full rounded-md bg-secondary py-2 text-sm">Copiar código Pix</button>
          <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Aguardando pagamento...</p>
        </div>
      ) : (
        <button disabled={loading || active === null} onClick={start} className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-60">
          {loading ? "Gerando Pix..." : "Ser Premium com Pix — R$ 41,40"}
        </button>
      )}
    </div>
  );
}
