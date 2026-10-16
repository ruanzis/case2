import { Minus, Plus, ShoppingCart, X, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { brl, type Skin } from "@/lib/skins";
import { playTap } from "@/lib/tap-sound";
import { cn } from "@/lib/utils";

export function SkinCard({ s }: { s: Skin }) {
  const cart = useCart();
  const inCart = cart.count(s.id);
  const [picking, setPicking] = useState(false);
  const [qty, setQty] = useState(1);
  const left = 10 - inCart;

  const add = () => {
    playTap();
    cart.add(s, Math.min(qty, left));
    setPicking(false);
    setQty(1);
    toast.success("Item adicionado ao carrinho", {
      action: { label: "Ver carrinho", onClick: () => cart.setOpen(true) },
      classNames: { actionButton: "!bg-success !text-primary-foreground !font-medium" },
    });
  };

  return (
    <div className="group relative flex flex-col rounded-lg bg-card p-2 transition-colors hover:bg-card-hover">
      <div className="relative flex h-24 items-center justify-center">
        <img src={s.image} alt={s.name} loading="lazy" className="max-h-full max-w-full object-contain transition-transform group-hover:scale-105" />
      </div>
      <div className="mt-1 flex h-4 gap-1 text-[10px]">
        {s.discount && <span className="rounded bg-success/15 px-1 text-success">{s.discount}%</span>}
        {s.delivery && (
          <span className={cn("flex items-center gap-0.5 rounded px-1", s.delivery === "1m" ? "bg-instant text-primary-foreground" : "bg-instant/20 text-instant")}>
            <Zap className="h-2.5 w-2.5" />{s.delivery}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-[11px] text-muted-foreground" title={s.name}>
        {s.wear ? (
          <>
            {s.stattrak && <span className="text-stattrak">ST / </span>}
            {s.wear} / {s.float?.toFixed(4)}
          </>
        ) : s.name}
      </p>
      <p className="truncate text-[11px]" title={s.name}>{s.wear ? s.name : ""}</p>
      <p className="text-sm font-semibold">{brl(s.price)}</p>

      {picking ? (
        <div className="mt-2 space-y-1.5">
          <div className="flex items-center justify-between rounded-md bg-secondary px-1 py-1">
            <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Diminuir" className="rounded p-0.5 hover:bg-background"><Minus className="h-3.5 w-3.5" /></button>
            <span className="text-sm font-semibold tabular-nums">{qty}</span>
            <button onClick={() => setQty((q) => Math.min(left, q + 1))} aria-label="Aumentar" className="rounded p-0.5 hover:bg-background"><Plus className="h-3.5 w-3.5" /></button>
          </div>
          <div className="flex gap-1">
            <button onClick={add} className="flex-1 rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground">Adicionar</button>
            <button onClick={() => { setPicking(false); setQty(1); }} aria-label="Cancelar" className="rounded-md bg-secondary px-2"><X className="h-3.5 w-3.5" /></button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => {
            if (left <= 0) { toast.info("Limite de 10 unidades deste item no carrinho."); return; }
            setPicking(true);
          }}
          className={cn("mt-2 flex items-center justify-center gap-1 rounded-md py-1.5 text-xs transition-colors", inCart ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground")}
          aria-label="Adicionar ao carrinho"
        >
          <ShoppingCart className="h-4 w-4" />{inCart > 0 && <span>{inCart}</span>}
        </button>
      )}
    </div>
  );
}
