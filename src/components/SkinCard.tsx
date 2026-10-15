import { ShoppingCart, Zap } from "lucide-react";
import { useCart } from "@/lib/cart";
import { brl, type Skin } from "@/lib/skins";
import { cn } from "@/lib/utils";

export function SkinCard({ s }: { s: Skin }) {
  const cart = useCart();
  const inCart = cart.has(s.id);
  return (
    <div className="group flex flex-col rounded-lg bg-card p-2 transition-colors hover:bg-card-hover">
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
      <button
        onClick={() => cart.toggle(s)}
        className={cn("mt-2 flex items-center justify-center rounded-md py-1.5 transition-colors", inCart ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-primary hover:text-primary-foreground")}
        aria-label={inCart ? "Remover do carrinho" : "Adicionar ao carrinho"}
      >
        <ShoppingCart className="h-4 w-4" />
      </button>
    </div>
  );
}
