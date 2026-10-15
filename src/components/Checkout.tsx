import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { QRCodeSVG } from "qrcode.react";
import { Copy, CheckCircle2, Loader2, X, QrCode, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { brl } from "@/lib/skins";
import { createPix, checkPix, payCard as payCardFn } from "@/lib/pix.functions";

type Pix = { pixCode: string; reference: string; amount: number };

export function Checkout({ onClose }: { onClose: () => void }) {
  const cart = useCart();
  const bought = useRef(cart.items);
  const gen = useServerFn(createPix);
  const check = useServerFn(checkPix);
  const cardPay = useServerFn(payCardFn);
  const [method, setMethod] = useState<"pix" | "card">("pix");
  const [loading, setLoading] = useState(false);
  const [pix, setPix] = useState<Pix | null>(null);
  const [paid, setPaid] = useState(false);
  const [approving, setApproving] = useState(false);
  const [card, setCard] = useState({ number: "", name: "", exp: "", cvv: "" });

  const approve = (msg: string) => {
    setApproving(true);
    window.setTimeout(() => {
      setApproving(false);
      setPaid(true);
      toast.success(msg);
    }, 6000);
  };

  useEffect(() => {
    if (!pix || paid) return;
    const t = setInterval(async () => {
      try {
        const r = await check({ data: { reference: pix.reference } });
        if (r.isFinal) {
          clearInterval(t);
          if (r.status === "completed") {
            cart.clear();
            await cart.refresh();
            approve("Pagamento confirmado!");
          } else toast.error("Pagamento não concluído.");
        }
      } catch {}
    }, 5000);
    return () => clearInterval(t);
  }, [pix, paid]);

  const startPix = async () => {
    setLoading(true);
    try {
      const r = await gen({ data: { ids: bought.current.map((i) => i.id) } });
      if ("error" in r && r.error) toast.error(r.error);
      else setPix(r as Pix);
    } catch {
      toast.error("Não foi possível gerar o Pix.");
    } finally {
      setLoading(false);
    }
  };

  const payCard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (card.number.replace(/\D/g, "").length < 13 || !card.name || card.exp.length !== 5 || card.cvv.length < 3)
      { toast.error("Preencha os dados do cartão."); return; }
    setLoading(true);
    try {
      await cardPay({ data: { ids: bought.current.map((i) => i.id) } });
      cart.clear();
      await cart.refresh();
      approve("Pagamento com cartão aprovado!");
    } catch {
      toast.error("Não foi possível concluir o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const input = "w-full rounded-md border bg-card px-3 py-2 text-sm outline-none focus:border-primary";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-lg bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Pagamento</h2>
          <button onClick={onClose} aria-label="Fechar"><X className="h-5 w-5" /></button>
        </div>

        {approving ? (
          <div className="py-12 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="font-semibold">Aprovando pagamento...</p>
            <p className="mt-1 text-sm text-muted-foreground">Aguarde, isso leva alguns segundos.</p>
          </div>
        ) : paid ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-primary" />
            <p className="font-semibold">Pagamento confirmado!</p>
            <p className="text-sm text-muted-foreground">Seus itens serão entregues em instantes.</p>
          </div>
        ) : pix ? (
          <div className="text-center">
            <p className="mb-3 text-sm text-muted-foreground">Escaneie o QR Code ou copie o código Pix</p>
            <div className="mx-auto mb-3 w-fit rounded-md bg-foreground p-3">
              <QRCodeSVG value={pix.pixCode} size={200} />
            </div>
            <p className="mb-3 text-xl font-bold">{brl(pix.amount)}</p>
            <button
              onClick={() => { navigator.clipboard.writeText(pix.pixCode); toast.success("Código copiado"); }}
              className="mb-3 flex w-full items-center justify-center gap-2 rounded-md border py-2 text-sm"
            >
              <Copy className="h-4 w-4" /> Copiar código Pix
            </button>
            <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Aguardando pagamento...
            </p>
          </div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {([["pix", "Pix", QrCode], ["card", "Cartão", CreditCard]] as const).map(([m, l, I]) => (
                <button key={m} onClick={() => setMethod(m)}
                  className={`flex items-center justify-center gap-2 rounded-md border py-2 text-sm ${method === m ? "border-primary text-primary" : ""}`}>
                  <I className="h-4 w-4" /> {l}
                </button>
              ))}
            </div>
            <div className="mb-4 flex justify-between text-sm"><span>Total</span><span className="font-semibold">{brl(cart.total)}</span></div>
            {method === "pix" ? (
              <button onClick={startPix} disabled={loading || !cart.items.length}
                className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50">
                {loading ? "Gerando Pix..." : "Gerar Pix"}
              </button>
            ) : (
              <form onSubmit={payCard} className="space-y-2">
                <input className={input} placeholder="Número do cartão" inputMode="numeric" value={card.number} maxLength={19} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ") })} />
                <input className={input} placeholder="Nome impresso no cartão" value={card.name} onChange={(e) => setCard({ ...card, name: e.target.value })} />
                <div className="grid grid-cols-2 gap-2">
                  <input className={input} placeholder="MM/AA" inputMode="numeric" maxLength={5} value={card.exp} onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setCard({ ...card, exp: d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d }); }} />
                  <input className={input} placeholder="CVV" inputMode="numeric" maxLength={3} value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, "").slice(0, 3) })} />
                </div>
                <button disabled={loading || !cart.items.length}
                  className="w-full rounded-md bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50">
                  {loading ? "Processando..." : "Pagar com cartão"}
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
